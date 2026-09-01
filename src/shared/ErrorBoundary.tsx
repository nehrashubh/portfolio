import { Component, type ReactNode } from 'react';

type Props = { fallback: ReactNode; children: ReactNode };
type State = { failed: boolean };

/**
 * Keeps a failed glb load (or any scene-side throw) from blanking the page —
 * the carousel still works over the gradient background.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[scene] recovered from', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
