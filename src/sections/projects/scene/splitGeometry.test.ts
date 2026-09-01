import { BufferAttribute, BufferGeometry } from 'three';
import { splitByCentroidX } from './splitGeometry';

/** One triangle whose three vertices all sit near `x`. */
const triangleAt = (x: number) => [x, 0, 0, x + 0.1, 1, 0, x - 0.1, 0, 1];

function geometryOf(...xs: number[]): BufferGeometry {
  const position = new Float32Array(xs.flatMap(triangleAt));
  const uv = new Float32Array(xs.flatMap(() => [0, 0, 1, 0, 0, 1]));
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('uv', new BufferAttribute(uv, 2));
  return geometry;
}

const triangleCount = (geometry: BufferGeometry) => geometry.getAttribute('position').count / 3;

describe('splitByCentroidX', () => {
  it('sends each triangle to the side its centroid falls on', () => {
    const { left, right } = splitByCentroidX(geometryOf(-2, -1, 3));
    expect(triangleCount(left)).toBe(2);
    expect(triangleCount(right)).toBe(1);
  });

  it('loses and duplicates nothing', () => {
    const input = geometryOf(-3, -1, 0.5, 2, 4);
    const { left, right } = splitByCentroidX(input);
    expect(triangleCount(left) + triangleCount(right)).toBe(triangleCount(input));
  });

  it('carries every attribute across, not just position', () => {
    const { left } = splitByCentroidX(geometryOf(-2, 3));
    expect(left.getAttribute('uv')).toBeDefined();
    expect(left.getAttribute('uv').count).toBe(3);
    expect(left.getAttribute('uv').itemSize).toBe(2);
  });

  it('handles indexed geometry by de-indexing it first', () => {
    const input = geometryOf(-2, 3);
    input.setIndex([0, 1, 2, 3, 4, 5]);
    const { left, right } = splitByCentroidX(input);
    expect(triangleCount(left)).toBe(1);
    expect(triangleCount(right)).toBe(1);
  });

  it('takes the cut plane as a parameter', () => {
    // Both triangles are left of x = 5.
    const { left, right } = splitByCentroidX(geometryOf(-2, 3), 5);
    expect(triangleCount(left)).toBe(2);
    expect(triangleCount(right)).toBe(0);
  });

  it('returns an empty half rather than throwing when one side is unused', () => {
    const { left, right } = splitByCentroidX(geometryOf(1, 2));
    expect(triangleCount(left)).toBe(0);
    expect(triangleCount(right)).toBe(2);
  });
});
