import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const Boom = (): never => {
  throw new Error('glb failed to load');
};

describe('ErrorBoundary', () => {
  it('renders its children when nothing goes wrong', () => {
    render(
      <ErrorBoundary fallback={<p>fallback</p>}>
        <p>content</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders the fallback instead of crashing the page when a child throws', () => {
    // React logs the caught error; silence it so the run stays readable.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<p>fallback</p>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('fallback')).toBeInTheDocument();
    spy.mockRestore();
  });
});

describe('ErrorBoundary recovery', () => {
  it('hands the error and a retry to a function fallback', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={(error) => <p>{(error as Error).message}</p>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('glb failed to load')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('remounts the subtree when retry is called, so a missed chunk is not permanent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;
    const Flaky = () => {
      if (shouldThrow) throw new Error('chunk failed');
      return <p>content</p>;
    };
    render(
      <ErrorBoundary
        fallback={(_error, retry) => (
          <button type="button" onClick={retry}>
            Try again
          </button>
        )}
      >
        <Flaky />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    shouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('content')).toBeInTheDocument();
    spy.mockRestore();
  });
});
