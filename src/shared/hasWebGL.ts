/**
 * Whether this browser can give us a WebGL context.
 *
 * Only gates mounting the canvas. There is no full-page fallback any more: the
 * deck is DOM, so without WebGL everything except the hands still works, and a
 * "this needs WebGL" message would simply be untrue.
 */
export function hasWebGL(createCanvas = () => document.createElement('canvas')): boolean {
  try {
    const canvas = createCanvas();
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
