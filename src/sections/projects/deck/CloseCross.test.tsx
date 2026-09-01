import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CloseCross from './CloseCross';

describe('CloseCross', () => {
  it('is a labelled button, so it is reachable and announced', () => {
    render(<CloseCross onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls onClose when clicked', async () => {
    const onClose = vi.fn();
    render(<CloseCross onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not let the click reach the card behind it', async () => {
    const onClose = vi.fn();
    const onCardClick = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events
      <div onClick={onCardClick}>
        <CloseCross onClose={onClose} />
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onCardClick).not.toHaveBeenCalled();
  });
});
