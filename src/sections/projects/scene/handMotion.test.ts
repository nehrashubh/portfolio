import { damp, idleSway, leanForVelocity, MAX_LEAN } from './handMotion';

describe('idleSway', () => {
  it('is completely still under reduced motion', () => {
    expect(idleSway(1.7, true)).toEqual({ lift: 0, rotZ: 0 });
  });

  it('stays within a few centimetres and a couple of degrees', () => {
    for (let t = 0; t < 20; t += 0.05) {
      const { lift, rotZ } = idleSway(t, false);
      expect(Math.abs(lift)).toBeLessThanOrEqual(0.04);
      expect(Math.abs(rotZ)).toBeLessThanOrEqual(0.03);
    }
  });

  it('actually moves, so the hands never look frozen', () => {
    const samples = [0, 0.5, 1, 1.5, 2].map((t) => idleSway(t, false).lift);
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.01);
  });
});

describe('leanForVelocity', () => {
  it('does not lean at rest', () => {
    // toBeCloseTo, not toBe: negating zero yields -0, which Object.is rejects.
    expect(leanForVelocity(0, false)).toBeCloseTo(0);
  });

  it('leans opposite ways for opposite travel', () => {
    expect(Math.sign(leanForVelocity(4, false))).toBe(-Math.sign(leanForVelocity(-4, false)));
  });

  it('leans back, not forward, when the deck travels upward', () => {
    // Positive deck velocity moves pills up the screen, and hands carrying
    // something that is rising tilt away from it.
    expect(leanForVelocity(4, false)).toBeLessThan(0);
  });

  it('clamps, so a hard fling cannot spin the hands', () => {
    expect(leanForVelocity(500, false)).toBeCloseTo(-MAX_LEAN);
    expect(leanForVelocity(-500, false)).toBeCloseTo(MAX_LEAN);
  });

  it('is flat under reduced motion', () => {
    expect(leanForVelocity(40, true)).toBe(0);
  });
});

describe('damp', () => {
  it('moves toward the target without overshooting', () => {
    const next = damp(0, 1, 3, 1 / 60);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });

  it('converges on the target given enough time', () => {
    let value = 0;
    for (let i = 0; i < 600; i++) value = damp(value, 1, 3, 1 / 60);
    expect(value).toBeCloseTo(1, 4);
  });

  it('is frame-rate independent', () => {
    let sixty = 0;
    for (let i = 0; i < 60; i++) sixty = damp(sixty, 1, 3, 1 / 60);
    let thirty = 0;
    for (let i = 0; i < 30; i++) thirty = damp(thirty, 1, 3, 1 / 30);
    expect(sixty).toBeCloseTo(thirty, 3);
  });
});
