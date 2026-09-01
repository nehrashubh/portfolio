import { hasWebGL } from './hasWebGL';

describe('hasWebGL', () => {
  it('is false when the browser gives no webgl context', () => {
    const canvas = { getContext: () => null } as unknown as HTMLCanvasElement;
    expect(hasWebGL(() => canvas)).toBe(false);
  });

  it('is true when a webgl context comes back', () => {
    const canvas = { getContext: () => ({}) } as unknown as HTMLCanvasElement;
    expect(hasWebGL(() => canvas)).toBe(true);
  });

  it('is false rather than throwing when getContext itself blows up', () => {
    const canvas = {
      getContext: () => {
        throw new Error('blocked');
      },
    } as unknown as HTMLCanvasElement;
    expect(hasWebGL(() => canvas)).toBe(false);
  });
});
