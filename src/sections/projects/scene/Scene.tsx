import { Canvas } from '@react-three/fiber';
import { Suspense, type RefObject } from 'react';
import type { CarouselState } from '../carousel/carousel';
import { ErrorBoundary } from '../../../shared/ErrorBoundary';
import { useDpr } from '../../../shared/useDpr';
import HandsModel from './HandsModel';

export default function Scene({
  narrow,
  stateRef,
  dimmed,
}: {
  narrow: boolean;
  stateRef: RefObject<CarouselState>;
  /** True while a project card is open in front of the hands. */
  dimmed: boolean;
}) {
  const dpr = useDpr();
  return (
    <Canvas
      // The camera is fixed for the lifetime of the app. Nothing may move it.
      camera={{ fov: 45, position: [0, 0, 6], near: 0.1, far: 100 }}
      // No tone mapping: every material in the glb is unlit and the lighting is
      // painted into the texture. ACES would re-grade art that is already graded.
      gl={{ antialias: true, toneMapping: 0, powerPreference: 'high-performance' }}
      dpr={dpr}
      // The deck is DOM on top of this canvas. Without this the canvas eats
      // every click meant for a pill.
      style={{ pointerEvents: 'none' }}
    >
      {/* Deliberately no lights. Every material in the model is unlit, so the
          scene is the artist's painting shown as painted. */}
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <HandsModel narrow={narrow} stateRef={stateRef} dimmed={dimmed} />
        </Suspense>
      </ErrorBoundary>
    </Canvas>
  );
}
