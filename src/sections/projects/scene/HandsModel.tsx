import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, type RefObject } from 'react';
import { Box3, Group, type Material, Mesh, Vector3 } from 'three';
import type { CarouselState } from '../carousel/carousel';
import { damp, idleSway, leanForVelocity } from './handMotion';
import {
  fitToHeight,
  HAND_DROP,
  HAND_DROP_NARROW,
  HAND_HEIGHT,
  HAND_HEIGHT_NARROW,
  HAND_OVERHANG,
  HAND_OVERHANG_NARROW,
  placeHalf,
} from './modelFraming';
import { splitByCentroidX } from './splitGeometry';
import { useReducedMotion as usePrefersReducedMotion } from '../../../shared/useReducedMotion';

const HANDS_URL = '/models/hands.glb';
/** Self-hosted copy of three's Draco decoder, shared with the other scenes. */
const DRACO_PATH = '/draco/';

/** How quickly the lean and the breathing follow their targets. */
const FOLLOW = 3;

/** How far the hands fade and step aside behind an open card. */
const DIM_OPACITY = 0.5;
const DIM_STEP = 0.35;
/**
 * On a phone the hands sit *behind* the deck rather than beside it, so they are
 * held back permanently — the pill type has to stay legible over them.
 *
 * Lower than it looks like it needs to be: the model layers several translucent
 * meshes over each other, so the composite reads considerably stronger than any
 * single material's alpha. On a phone the pills sit directly on top of the
 * drawing rather than between the hands, so it has to fall back further still
 * or the titles are read against knuckles.
 */
const NARROW_OPACITY = 0.13;

type Half = { group: Group; bounds: Box3 };
type Halves = { left: Half; right: Half; pairBounds: Box3; materials: Material[] };

/**
 * Cuts the model in two at x = 0 and returns a group per hand.
 *
 * The glb merges both hands into one mesh per material, so they cannot be moved
 * apart without splitting the geometry. World matrices are baked in first so the
 * cut is measured in the space the Sketchfab root matrix leaves the model in —
 * that matrix is what stands the hands upright.
 */
function buildHalves(source: Group): Halves {
  const clone = source.clone(true);
  clone.updateMatrixWorld(true);

  const left = new Group();
  const right = new Group();
  left.name = 'hand-left';
  right.name = 'hand-right';

  const meshes: Mesh[] = [];
  clone.traverse((object) => {
    if (object instanceof Mesh) meshes.push(object);
  });

  for (const mesh of meshes) {
    const baked = mesh.geometry.clone();
    baked.applyMatrix4(mesh.matrixWorld);
    const halves = splitByCentroidX(baked, 0);
    if (halves.left.getAttribute('position').count > 0) {
      left.add(new Mesh(halves.left, mesh.material));
    }
    if (halves.right.getAttribute('position').count > 0) {
      right.add(new Mesh(halves.right, mesh.material));
    }
  }

  const leftBounds = new Box3().setFromObject(left);
  const rightBounds = new Box3().setFromObject(right);

  // Every material, with its authored alpha stashed *on the material* so the
  // capture is idempotent. StrictMode double-mounts, and re-reading a currently
  // faded material would record 0.42 as its base and the hands would fade away
  // permanently.
  const materials: Material[] = [];
  for (const group of [left, right]) {
    group.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const list = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of list) {
        material.transparent = true;
        material.userData.baseOpacity ??= material.opacity;
        materials.push(material);
      }
    });
  }

  return {
    left: { group: left, bounds: leftBounds },
    right: { group: right, bounds: rightBounds },
    // One scale for both, off the pair's combined height. Fitting each half to
    // the same height would scale them differently — they are 0.82 and 0.90 tall
    // — and the two halves of one drawing would stop matching.
    pairBounds: leftBounds.clone().union(rightBounds),
    materials,
  };
}

export default function HandsModel({
  narrow,
  stateRef,
  dimmed,
}: {
  narrow: boolean;
  stateRef: RefObject<CarouselState>;
  dimmed: boolean;
}) {
  const { scene } = useGLTF(HANDS_URL, DRACO_PATH);
  const reduced = usePrefersReducedMotion();

  // Cloned and split once. StrictMode double-mounts, and mutating the cached
  // glb twice would cut an already-cut model.
  const { left, right, pairBounds, materials } = useMemo(
    () => buildHalves(scene as Group),
    [scene],
  );

  const leftRef = useRef<Group>(null);
  const rightRef = useRef<Group>(null);

  // The live viewport, not a constant: r3f fixes the vertical fov, so the visible
  // *width* is a function of the aspect ratio and collapses to about 2.3 units on
  // a phone. Anchoring to a hard-coded 7.95 put the hands entirely off screen.
  const viewport = useThree((state) => state.viewport);

  const scale = fitToHeight(
    pairBounds.getSize(new Vector3()),
    narrow ? HAND_HEIGHT_NARROW : HAND_HEIGHT,
  );
  const framing = {
    frameWidth: viewport.width,
    frameHeight: viewport.height,
    overhang: narrow ? HAND_OVERHANG_NARROW : HAND_OVERHANG,
    drop: narrow ? HAND_DROP_NARROW : HAND_DROP,
  };
  const leftPosition = placeHalf(left.bounds, 'left', scale, framing);
  const rightPosition = placeHalf(right.bounds, 'right', scale, framing);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const sway = idleSway(state.clock.elapsedTime, reduced);
    // Read only. Deck owns the frame loop and is the only caller of advance().
    const lean = leanForVelocity(stateRef.current?.velocity ?? 0, reduced);

    for (const [ref, position, mirror] of [
      [leftRef, leftPosition, 1],
      [rightRef, rightPosition, -1],
    ] as const) {
      const group = ref.current;
      if (!group) continue;
      group.rotation.z = damp(group.rotation.z, (sway.rotZ + lean) * mirror, FOLLOW, dt);
      group.position.y = damp(group.position.y, position[1] + sway.lift, FOLLOW, dt);
      // Step aside for an open card. Outward is away from the centre line, which
      // is the opposite of the lean's mirror.
      const aside = dimmed ? -mirror * DIM_STEP : 0;
      group.position.x = damp(group.position.x, position[0] + aside, FOLLOW, dt);
    }

    // No blur: there is no cheap WebGL equivalent, and a post-processing pass
    // would reintroduce the composer this scene deliberately dropped. The fade
    // and the step aside carry it.
    const fade = (dimmed ? DIM_OPACITY : 1) * (narrow ? NARROW_OPACITY : 1);
    for (const material of materials) {
      const base = material.userData.baseOpacity as number;
      material.opacity = damp(material.opacity, base * fade, FOLLOW, dt);
    }
  });

  return (
    <>
      <group ref={leftRef} position={leftPosition} scale={scale}>
        <primitive object={left.group} />
      </group>
      <group ref={rightRef} position={rightPosition} scale={scale}>
        <primitive object={right.group} />
      </group>
    </>
  );
}

useGLTF.preload(HANDS_URL, DRACO_PATH);
