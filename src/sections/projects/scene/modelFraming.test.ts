import { Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import {
  AXIS_DEGREES,
  deckSpan,
  HAND_CORRIDOR,
  PILL_W,
  stepXFor,
  STEP_Y,
} from '../deck/deckLayout';
import {
  fitToHeight,
  FRAME_WIDTH,
  HAND_FRAMING,
  HAND_HEIGHT,
  placeHalf,
  subjectBounds,
} from './modelFraming';

describe('subjectBounds', () => {
  const meshAt = (name: string, x: number, y: number, z: number, size: number) => {
    const mesh = new Mesh(new BoxGeometry(size, size, size), new MeshBasicMaterial());
    mesh.name = name;
    mesh.position.set(x, y, z);
    return mesh;
  };

  it('measures only the named nodes, ignoring backdrop geometry', () => {
    const root = new Group();
    root.add(meshAt('cat_0', 0, 0, 0, 1));
    root.add(meshAt('edge_0', 0, 0, 0, 1));
    // A ground plane and moon many times larger, exactly like cat.glb's.
    root.add(meshAt('f_0', 0, -5, 0, 20));
    root.add(meshAt('moon_0', -8, 6, 10, 6));
    root.updateMatrixWorld(true);

    const box = subjectBounds(root, ['cat', 'edge']);
    const size = box.getSize(new Vector3());
    expect(size.y).toBeCloseTo(1, 5);
    expect(size.x).toBeCloseTo(1, 5);
  });

  it('is empty when nothing matches, rather than silently spanning everything', () => {
    const root = new Group();
    root.add(meshAt('moon_0', 0, 0, 0, 4));
    root.updateMatrixWorld(true);
    expect(subjectBounds(root, ['cat']).isEmpty()).toBe(true);
  });
});

describe('fitToHeight', () => {
  it('returns the scale factor that makes a model the requested height', () => {
    expect(fitToHeight(new Vector3(2, 4, 2), 3.2)).toBeCloseTo(0.8, 5);
  });

  it('falls back to 1 for a degenerate bounding box instead of dividing by zero', () => {
    expect(fitToHeight(new Vector3(0, 0, 0), 3.2)).toBe(1);
  });
});

describe('placeHalf', () => {
  const FRAME = { frameWidth: 7.95, frameHeight: 4.97, overhang: 0.2, drop: 0.35 };
  const SCALE = 4.6;
  /** A one-unit cube, so the arithmetic is easy to check by hand. */
  const unitBox = () => new Box3(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5));

  /**
   * Where an edge of the placed half actually lands in world space. The group's
   * transform applies to the raw local coordinate, so these are the box's own
   * bounds — not anything measured from its centre.
   */
  const outerEdgeOf = (box: Box3, side: 'left' | 'right') => {
    const local = side === 'left' ? box.min.x : box.max.x;
    return placeHalf(box, side, SCALE, FRAME)[0] + local * SCALE;
  };
  const bottomEdgeOf = (box: Box3, side: 'left' | 'right') =>
    placeHalf(box, side, SCALE, FRAME)[1] + box.min.y * SCALE;

  it('runs each hand off its side of the frame by exactly the overhang', () => {
    expect(outerEdgeOf(unitBox(), 'right')).toBeCloseTo(7.95 / 2 + 0.2);
    expect(outerEdgeOf(unitBox(), 'left')).toBeCloseTo(-(7.95 / 2 + 0.2));
  });

  it('crops the wrist exactly the drop below the frame bottom', () => {
    expect(bottomEdgeOf(unitBox(), 'left')).toBeCloseTo(-4.97 / 2 - 0.35);
  });

  it('leaves the hand mostly in frame rather than under it', () => {
    // Regression: an earlier version put the half's *centre* below the frame, so
    // only the fingertips showed in the bottom corners.
    const top = bottomEdgeOf(unitBox(), 'left') + 1 * SCALE;
    expect(top).toBeGreaterThan(0);
  });

  it('mirrors two halves of the same shape across the centre line', () => {
    const left = placeHalf(unitBox(), 'left', SCALE, FRAME);
    const right = placeHalf(unitBox(), 'right', SCALE, FRAME);
    expect(left[0]).toBeCloseTo(-right[0]);
    expect(left[1]).toBeCloseTo(right[1]);
  });

  it('puts the left half on the left and the right half on the right', () => {
    expect(placeHalf(unitBox(), 'left', SCALE, FRAME)[0]).toBeLessThan(0);
    expect(placeHalf(unitBox(), 'right', SCALE, FRAME)[0]).toBeGreaterThan(0);
  });

  it('anchors off the half own bounds, so an off-centre half is not skewed', () => {
    // A split half's bounds sit nowhere near the origin. Both of these are the
    // same size, so both edges must land in the same place regardless.
    const offCentre = new Box3(new Vector3(3, 7, -2), new Vector3(4, 8, -1));
    expect(outerEdgeOf(offCentre, 'right')).toBeCloseTo(7.95 / 2 + 0.2);
    expect(bottomEdgeOf(offCentre, 'right')).toBeCloseTo(-4.97 / 2 - 0.35);
  });

  it('never produces a non-finite position on a degenerate bounding box', () => {
    const flat = new Box3(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
    for (const value of placeHalf(flat, 'left', SCALE, FRAME)) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});

describe('the real hands leave room for the deck', () => {
  // Measured off damaged_hands.glb in the browser, after the Sketchfab root
  // matrix. The two halves differ in both width and height, which is why they
  // share one scale.
  const LEFT = new Box3(
    new Vector3(-0.494160, 0.025243, -0.049477),
    new Vector3(-0.123363, 0.843052, 0.279740),
  );
  const RIGHT = new Box3(
    new Vector3(0.126352, 0.025243, -0.070596),
    new Vector3(0.486911, 0.929074, 0.279740),
  );

  /**
   * This is the test that ties the two halves of the design together: how big
   * the hands are, and how wide the deck may be. Change HAND_HEIGHT, OVERHANG or
   * the pill width and this is what catches the collision — it has already done
   * so once, when the hands were enlarged from 4.2 to 4.8 and the corridor fell
   * from 62% to 54%.
   */
  it('clears the corridor the deck layout assumes', () => {
    const options = HAND_FRAMING;
    const scale = fitToHeight(LEFT.clone().union(RIGHT).getSize(new Vector3()), HAND_HEIGHT);

    const innerLeft = placeHalf(LEFT, 'left', scale, options)[0] + LEFT.max.x * scale;
    const innerRight = placeHalf(RIGHT, 'right', scale, options)[0] + RIGHT.min.x * scale;
    const corridor = ((innerRight - innerLeft) / FRAME_WIDTH) * 100;

    expect(corridor).toBeGreaterThan(HAND_CORRIDOR);
    expect(corridor).toBeGreaterThan(deckSpan(PILL_W, stepXFor(AXIS_DEGREES, STEP_Y)));
  });

  it('keeps both hands upright and mostly on screen', () => {
    const options = HAND_FRAMING;
    const scale = fitToHeight(LEFT.clone().union(RIGHT).getSize(new Vector3()), HAND_HEIGHT);
    for (const [box, side] of [
      [LEFT, 'left'],
      [RIGHT, 'right'],
    ] as const) {
      const bottom = placeHalf(box, side, scale, options)[1] + box.min.y * scale;
      const top = placeHalf(box, side, scale, options)[1] + box.max.y * scale;
      // Wrist cropped below the frame, fingertips well inside it.
      expect(bottom).toBeLessThan(-4.97 / 2);
      expect(top).toBeGreaterThan(0);
      expect(top).toBeLessThan(4.97 / 2);
    }
  });
});
