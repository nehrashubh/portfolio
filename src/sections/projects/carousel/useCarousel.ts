import { useCallback, useEffect, useRef, type RefObject } from 'react';
import {
  applyImpulse,
  type CarouselState,
  DRAG_PX_PER_SLOT,
  DRAG_PX_PER_SLOT_TOUCH,
  nudge,
  step,
  targetFor,
  wheelToVelocity,
} from './carousel';

type DragState = {
  pointerId: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  /** Total pointer travel, to tell a drag from a click. */
  moved: number;
};

/**
 * Ceiling on release velocity, in cards per second. Pointer samples can arrive
 * less than a millisecond apart, and dividing a real displacement by a
 * near-zero interval yields an absurd fling — without this, one jittery sample
 * can throw the carousel dozens of cards.
 */
const MAX_FLING_VELOCITY = 40;
/** Weight of the newest sample when smoothing release velocity. */
const FLING_SMOOTHING = 0.6;
/**
 * Pointer travel below which a release is treated as a click, in pixels.
 *
 * The pills are DOM elements now, so clicking one also produces
 * pointerdown/move/up with a pixel or two of jitter. Without this, clicking a
 * pill flings the deck out from under the click.
 */
const DRAG_CLICK_SLOP = 6;

const clampFling = (v: number) => Math.max(-MAX_FLING_VELOCITY, Math.min(MAX_FLING_VELOCITY, v));

/**
 * Owns carousel state and wires up wheel, pointer drag and keyboard input.
 *
 * Integration is deliberately *not* done here — the caller drives `advance(dt)`
 * from its own frame loop, and must be the only thing that does. Two callers
 * would step the deck twice per frame.
 *
 * Pass `enabled: false` to suspend every input, which is what the open project
 * card needs: otherwise the deck slides around underneath it.
 *
 * `hostRef` scopes the wheel listener to the section's own element rather than
 * the window, so the deck cannot swallow wheel events from anything outside
 * it and leaves no window-level preventDefault behind.
 */
export function useCarousel(count: number, enabled = true, hostRef?: RefObject<HTMLElement | null>) {
  const stateRef = useRef<CarouselState>({ position: 0, velocity: 0, target: null });
  const dragRef = useRef<DragState | null>(null);
  const countRef = useRef(count);
  countRef.current = count;

  useEffect(() => {
    if (!enabled) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      stateRef.current = applyImpulse(
        stateRef.current,
        wheelToVelocity(event.deltaY, event.deltaMode),
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault();
        stateRef.current = nudge(stateRef.current, 1);
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        stateRef.current = nudge(stateRef.current, -1);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      dragRef.current = {
        pointerId: event.pointerId,
        lastY: event.clientY,
        lastTime: performance.now(),
        velocity: 0,
        moved: 0,
      };
      stateRef.current = { ...stateRef.current, velocity: 0, target: null };
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      // Dragging up (decreasing clientY) moves the carousel forward.
      const dy = drag.lastY - event.clientY;
      const perSlot = event.pointerType === 'touch' ? DRAG_PX_PER_SLOT_TOUCH : DRAG_PX_PER_SLOT;
      const dSlots = dy / perSlot;
      const now = performance.now();
      const dt = Math.max((now - drag.lastTime) / 1000, 1 / 240);

      stateRef.current = {
        position: stateRef.current.position + dSlots,
        velocity: 0,
        target: null,
      };

      // Smooth across samples and cap, so neither jitter nor a near-zero
      // sample interval can produce a runaway fling.
      const sample = clampFling(dSlots / dt);
      drag.velocity = drag.velocity * (1 - FLING_SMOOTHING) + sample * FLING_SMOOTHING;
      drag.moved += Math.abs(dy);
      drag.lastY = event.clientY;
      drag.lastTime = now;
    };

    const onPointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      // Hand the flick's momentum to the coast/snap integrator — but only if the
      // pointer actually travelled. A click is not a flick.
      if (drag.moved >= DRAG_CLICK_SLOP) {
        stateRef.current = applyImpulse(stateRef.current, clampFling(drag.velocity));
      }
      dragRef.current = null;
    };

    const host: HTMLElement | Window = hostRef?.current ?? window;
    host.addEventListener('wheel', onWheel as EventListener, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      host.removeEventListener('wheel', onWheel as EventListener);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      dragRef.current = null;
    };
  }, [enabled, hostRef]);

  const advance = useCallback((dt: number) => {
    if (!dragRef.current) {
      stateRef.current = step(stateRef.current, dt, countRef.current);
    }
    return stateRef.current;
  }, []);

  /**
   * Travels to a card on the spring rather than jumping to it. Setting position
   * directly would land already-finished, with no animation to see.
   */
  const focusOn = useCallback((index: number) => {
    if (countRef.current <= 0) return;
    stateRef.current = {
      ...stateRef.current,
      target: targetFor(stateRef.current, index, countRef.current),
    };
  }, []);

  return { stateRef, advance, focusOn };
}
