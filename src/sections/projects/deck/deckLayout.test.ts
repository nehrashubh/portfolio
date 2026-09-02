import {
  AXIS_DEGREES,
  deckSpan,
  HAND_CORRIDOR,
  layoutForSlot,
  PILL_W,
  stepXFor,
  STEP_Y,
} from './deckLayout';

describe('stepXFor', () => {
  it('derives the horizontal step from the angle and the vertical step', () => {
    // At 45° the steps are equal.
    expect(stepXFor(45, 7.4)).toBeCloseTo(7.4, 4);
  });

  it('gives a smaller horizontal step for a steeper axis', () => {
    expect(stepXFor(75, 7.4)).toBeLessThan(stepXFor(60, 7.4));
  });

  it('matches the measured value at the chosen angle', () => {
    expect(stepXFor(60, 7.4)).toBeCloseTo(4.27, 2);
  });
});

describe('the deck fits between the hands', () => {
  it('clears the corridor at the chosen angle', () => {
    const span = deckSpan(PILL_W, stepXFor(AXIS_DEGREES, STEP_Y));
    expect(span).toBeCloseTo(52.7, 1);
    expect(span).toBeLessThan(HAND_CORRIDOR);
  });

  it('does not clear it below about 64 degrees, which is the floor', () => {
    expect(deckSpan(PILL_W, stepXFor(62, STEP_Y))).toBeGreaterThan(HAND_CORRIDOR);
  });

  it('leaves only a few degrees of room under the chosen angle', () => {
    // Worth stating as a test rather than a comment: the margin is thin enough
    // that a modest change to the axis, the pill width or the hand size closes
    // it. 65 clears, 63 does not.
    expect(deckSpan(PILL_W, stepXFor(65, STEP_Y))).toBeLessThan(HAND_CORRIDOR);
    expect(deckSpan(PILL_W, stepXFor(63, STEP_Y))).toBeGreaterThan(HAND_CORRIDOR);
  });
});

describe('layoutForSlot', () => {
  it('puts the focused pill dead centre, opaque and frontmost', () => {
    const focused = layoutForSlot(0, false);
    expect(focused.x).toBeCloseTo(0);
    expect(focused.y).toBeCloseTo(0);
    expect(focused.scale).toBeCloseTo(1);
    expect(focused.opacity).toBeCloseTo(1);
    expect(focused.focused).toBe(true);
  });

  it('sends the next pill up and to the right, the previous one down and left', () => {
    expect(layoutForSlot(1, false).y).toBeLessThan(0);
    expect(layoutForSlot(1, false).x).toBeGreaterThan(0);
    expect(layoutForSlot(-1, false).y).toBeGreaterThan(0);
    expect(layoutForSlot(-1, false).x).toBeLessThan(0);
  });

  it('fades and shrinks monotonically with distance', () => {
    let previous = layoutForSlot(0, false);
    for (let d = 0.25; d <= 2.5; d += 0.25) {
      const current = layoutForSlot(d, false);
      expect(current.opacity).toBeLessThan(previous.opacity);
      expect(current.scale).toBeLessThan(previous.scale);
      previous = current;
    }
  });

  it('matches the reference opacity falloff at the slot boundaries', () => {
    expect(layoutForSlot(1, false).opacity).toBeCloseTo(0.62, 2);
    expect(layoutForSlot(2, false).opacity).toBeCloseTo(0.3, 2);
  });

  it('keeps a departing pill in front of an arriving one at equal distance', () => {
    expect(layoutForSlot(-0.5, false).zIndex).toBeGreaterThan(layoutForSlot(0.5, false).zIndex);
  });

  it('never puts a neighbour in front of the focused pill', () => {
    const focused = layoutForSlot(0, false).zIndex;
    for (let d = -2.5; d <= 2.5; d += 0.1) {
      if (Math.abs(d) < 0.2) continue;
      expect(layoutForSlot(d, false).zIndex).toBeLessThan(focused);
    }
  });

  it('culls pills beyond the third slot', () => {
    expect(layoutForSlot(2, false).visible).toBe(true);
    expect(layoutForSlot(2.6, false).visible).toBe(false);
  });

  it('is symmetric in everything but the z tie-break', () => {
    for (const d of [0.4, 1, 1.7, 2.2]) {
      expect(layoutForSlot(d, false).opacity).toBeCloseTo(layoutForSlot(-d, false).opacity);
      expect(layoutForSlot(d, false).scale).toBeCloseTo(layoutForSlot(-d, false).scale);
      expect(layoutForSlot(d, false).x).toBeCloseTo(-layoutForSlot(-d, false).x);
    }
  });

  it('flattens the axis on narrow viewports, where there are no fingers to clear', () => {
    expect(Math.abs(layoutForSlot(1, true).x)).toBeLessThan(Math.abs(layoutForSlot(1, false).x));
  });
});
