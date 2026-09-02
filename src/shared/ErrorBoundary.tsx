import { Component, type ReactNode } from 'react';

/**
 * A fallback that can read the error and offer a way back. A plain node is
 * still accepted, for the callers that just want the subtree gone.
 */
export type Fallback = ReactNode | ((error: unknown, retry: () => void) => ReactNode);

type Props = { fallback: Fallback; children: ReactNode };
type State = { failed: boolean; error: unknown };

/**
 * Keeps a failed glb load (or any scene-side throw) from blanking the page.
 *
 * `retry` resets the boundary and remounts the subtree, which matters for the
 * one failure this catches most often: a dynamic import that did not arrive.
 * Without it a single missed chunk is permanent for the life of the page —
 * even a reload can serve the same stale HTML and fail identically.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { failed: true, error };
  }

  componentDidCatch(error: unknown) {
    console.error('[section] recovered from', error);
  }

  retry = () => this.setState({ failed: false, error: null });

  render() {
    if (!this.state.failed) return this.props.children;
    const { fallback } = this.props;
    return typeof fallback === 'function' ? fallback(this.state.error, this.retry) : fallback;
  }
}
