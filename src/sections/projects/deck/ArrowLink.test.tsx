import { render, screen } from '@testing-library/react';
import ArrowLink from './ArrowLink';

describe('ArrowLink', () => {
  it('is a real anchor to the project, opening in a new tab safely', () => {
    render(<ArrowLink url="https://example.com/one" label="View project" />);
    const link = screen.getByRole('link', { name: /view project/i });
    expect(link).toHaveAttribute('href', 'https://example.com/one');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
  });

  it('renders nothing rather than a dangerous href', () => {
    render(<ArrowLink url="javascript:alert(1)" label="View project" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(/view project/i)).not.toBeInTheDocument();
  });

  it('keeps a site fragment in this tab', () => {
    render(<ArrowLink url="#writeups/massagold" label="Read the writeups" />);
    const link = screen.getByRole('link', { name: 'Read the writeups' });
    expect(link).toHaveAttribute('href', '#writeups/massagold');
    expect(link).not.toHaveAttribute('target');
  });

  it('marks its arrows decorative so the label is announced once', () => {
    render(<ArrowLink url="https://example.com" label="View project" />);
    expect(screen.getByRole('link')).toHaveAccessibleName('View project');
  });
});
