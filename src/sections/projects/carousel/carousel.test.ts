import {
  applyImpulse,
  type CarouselState,
  NUDGE_VELOCITY,
  nudge,
  step,
  targetFor,
  wheelToVelocity,
  wrapOffset,
} from './carousel';

/** A free-running state at a position, with no travel outstanding. */
const at = (position: number, velocity = 0): CarouselState => ({
  position,
  velocity,
  target: null,
});

const settle = (state: CarouselState, count: number, seconds = 4) => {
  let s = state;
  for (let t = 0; t < seconds * 60; t++) s = step(s, 1 / 60, count);
  return s;
};

describe('wrapOffset', () => {
  it('is zero for the focused card', () => {
    expect(wrapOffset(3, 3, 8)).toBe(0);
  });

  it('puts the next card one slot below and the previous one slot above', () => {
    expect(wrapOffset(4, 3, 8)).toBe(1);
    expect(wrapOffset(2, 3, 8)).toBe(-1);
  });

  it('wraps the far end of the list around to be the previous card', () => {
    // With position on card 0, card 7 of 8 should read as -1, not +7.
    expect(wrapOffset(7, 0, 8)).toBe(-1);
    expect(wrapOffset(1, 0, 8)).toBe(1);
  });

  it('always returns an offset within [-count/2, count/2)', () => {
    for (let index = 0; index < 8; index++) {
      for (let p = -20; p <= 20; p += 0.25) {
        const d = wrapOffset(index, p, 8);
        expect(d).toBeGreaterThanOrEqual(-4);
        expect(d).toBeLessThan(4);
      }
    }
  });

  it('is continuous across the seam', () => {
    const before = wrapOffset(0, 3.99, 8);
    const after = wrapOffset(0, 4.01, 8);
    // Crossing the seam flips sign but the jump is the full period, not a
    // random discontinuity: both are ~4 in magnitude.
    expect(Math.abs(Math.abs(before) - Math.abs(after))).toBeLessThan(0.05);
  });

  it('does not wrap when there are too few cards to wrap safely', () => {
    expect(wrapOffset(1, 0, 2)).toBe(1);
    expect(wrapOffset(0, 1, 2)).toBe(-1);
  });

  it('returns 0 for an empty project list instead of dividing by zero', () => {
    expect(wrapOffset(0, 0, 0)).toBe(0);
    expect(Number.isNaN(wrapOffset(0, 2, 0))).toBe(false);
  });
});

describe('step', () => {
  it('comes to rest exactly on a card', () => {
    const settled = settle(at(0.3), 8);
    expect(settled.position).toBeCloseTo(0, 4);
    expect(settled.velocity).toBeCloseTo(0, 4);
  });

  it('snaps to the nearer card, not always down', () => {
    expect(settle(at(2.7), 8).position).toBeCloseTo(3, 4);
    expect(settle(at(2.2), 8).position).toBeCloseTo(2, 4);
  });

  it('carries a flick roughly one card and then settles on an integer', () => {
    const settled = settle(applyImpulse(at(0), NUDGE_VELOCITY), 8);
    expect(settled.position).toBeCloseTo(1, 4);
  });

  it('decays velocity monotonically while coasting', () => {
    let s = at(0, 20);
    let previous = Math.abs(s.velocity);
    for (let i = 0; i < 30; i++) {
      s = step(s, 1 / 60, 8);
      const current = Math.abs(s.velocity);
      expect(current).toBeLessThanOrEqual(previous + 1e-9);
      previous = current;
    }
  });

  it('normalises position into the list so it cannot drift unbounded', () => {
    const settled = settle(at(40), 8);
    expect(settled.position).toBeGreaterThanOrEqual(0);
    expect(settled.position).toBeLessThan(8);
  });

  it('clamps instead of wrapping when there are fewer than three cards', () => {
    expect(settle(at(0, 40), 2).position).toBeCloseTo(1, 4);
    expect(settle(at(1, -40), 2).position).toBeCloseTo(0, 4);
  });

  it('is inert with an empty project list', () => {
    expect(step(at(5, 5), 1 / 60, 0)).toEqual(at(0));
  });

  it('never produces NaN, even with a pathological frame time', () => {
    const s = step(at(0, 5), 0, 8);
    expect(Number.isFinite(s.position)).toBe(true);
    expect(Number.isFinite(s.velocity)).toBe(true);
  });
});

describe('nudge', () => {
  it('moves exactly one card per keypress', () => {
    expect(settle(nudge(at(0), 1), 8).position).toBeCloseTo(1, 4);
    expect(settle(nudge(at(3), -1), 8).position).toBeCloseTo(2, 4);
  });
});

describe('wheelToVelocity', () => {
  it('scrolling down advances the carousel forward', () => {
    expect(wheelToVelocity(100, 0)).toBeGreaterThan(0);
    expect(wheelToVelocity(-100, 0)).toBeLessThan(0);
  });

  it('normalises line and page deltas so Firefox is not glacial', () => {
    // deltaMode 1 = lines, 2 = pages. One line must count for far more than
    // one pixel, or line-mode wheels barely move.
    expect(Math.abs(wheelToVelocity(1, 1))).toBeGreaterThan(Math.abs(wheelToVelocity(1, 0)) * 10);
    expect(Math.abs(wheelToVelocity(1, 2))).toBeGreaterThan(Math.abs(wheelToVelocity(1, 1)));
  });

  it('turns one ordinary wheel notch into about one card', () => {
    const settled = settle(applyImpulse(at(0), wheelToVelocity(100, 0)), 8);
    expect(settled.position).toBeCloseTo(1, 4);
  });
});

describe('travelling to a target', () => {
  const start: CarouselState = { position: 0, velocity: 0, target: 2 };

  it('moves from a standstill, because the spring is engaged regardless of speed', () => {
    expect(step(start, 1 / 60, 8).position).toBeGreaterThan(0);
  });

  it('does not overshoot on the way, being critically damped', () => {
    let s = start;
    for (let t = 0; t < 240; t++) {
      s = step(s, 1 / 60, 8);
      expect(s.position).toBeLessThanOrEqual(2.001);
    }
  });

  it('arrives and clears the target so ordinary snapping resumes', () => {
    let s = start;
    for (let t = 0; t < 240; t++) s = step(s, 1 / 60, 8);
    expect(s.position).toBeCloseTo(2, 3);
    expect(s.target).toBeNull();
    expect(s.velocity).toBe(0);
  });

  it('takes appreciably longer than a single frame — it is animated, not assigned', () => {
    let s = start;
    let frames = 0;
    while (s.target !== null && frames < 600) {
      s = step(s, 1 / 60, 8);
      frames++;
    }
    expect(frames).toBeGreaterThan(12);
  });

  it('does not wrap position while a target is outstanding', () => {
    // Travelling from card 7 to card 8, which is card 0 the short way round.
    // Wrapping mid-flight would move the goalposts and the deck would lurch.
    let s: CarouselState = { position: 7, velocity: 0, target: 8 };
    for (let t = 0; t < 20; t++) {
      s = step(s, 1 / 60, 8);
      expect(s.position).toBeGreaterThan(6.9);
    }
  });

  it('folds the position back into range once the target is cleared', () => {
    let s: CarouselState = { position: 7, velocity: 0, target: 8 };
    for (let t = 0; t < 400; t++) s = step(s, 1 / 60, 8);
    expect(s.target).toBeNull();
    expect(s.position).toBeCloseTo(0, 3);
  });
});

describe('targetFor', () => {
  it('travels the short way round rather than all the way forward', () => {
    // From card 0, card 7 of 8 is one step back, not seven forward.
    expect(targetFor(at(0), 7, 8)).toBeCloseTo(-1);
    expect(targetFor(at(0), 1, 8)).toBeCloseTo(1);
  });

  it('composes from an outstanding target, not the in-flight position', () => {
    // Mid-travel toward card 2, clicking card 3 should aim at 3, not at whatever
    // fractional position the deck happens to be passing through.
    const midFlight: CarouselState = { position: 0.7, velocity: 5, target: 2 };
    expect(targetFor(midFlight, 3, 8)).toBeCloseTo(3);
  });

  it('is a no-op for the card already focused', () => {
    expect(targetFor(at(3), 3, 8)).toBeCloseTo(3);
  });

  it('returns 0 for an empty list instead of dividing by zero', () => {
    expect(targetFor(at(0), 0, 0)).toBe(0);
  });
});

describe('impulses cancel a target', () => {
  it('hands control back to the pointer', () => {
    expect(applyImpulse({ position: 0, velocity: 0, target: 4 }, 6.6).target).toBeNull();
    expect(nudge({ position: 0, velocity: 0, target: 4 }, 1).target).toBeNull();
  });
});
