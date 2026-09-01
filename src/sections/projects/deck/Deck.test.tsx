import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useCarousel } from '../carousel/useCarousel';
import { PROJECTS } from '../data/projects';
import Deck from './Deck';

// The hook binds window listeners and the component drives requestAnimationFrame;
// jsdom supplies both, so Deck renders without a canvas.
function Harness() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const carousel = useCarousel(PROJECTS.length, openIndex === null);
  return (
    <Deck carousel={carousel} narrow={false} openIndex={openIndex} onOpenChange={setOpenIndex} />
  );
}

const renderDeck = () => render(<Harness />);
/** The focused pill at rest is always the first project. */
const focusedPill = () =>
  screen.getByRole('button', { name: new RegExp(PROJECTS[0].title, 'i') });

describe('Deck', () => {
  it('renders one pill per project', () => {
    renderDeck();
    for (const project of PROJECTS) {
      expect(screen.getByText(project.title)).toBeInTheDocument();
    }
  });

  it('shows the focused project year alongside its title', () => {
    renderDeck();
    expect(screen.getAllByText(PROJECTS[0].date).length).toBeGreaterThan(0);
  });

  it('exposes the pills as buttons so they are reachable by keyboard', () => {
    renderDeck();
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(PROJECTS.length);
  });

  it('names each pill button after its own title and date', () => {
    renderDeck();
    // By reference, not a duplicated aria-label, so the two cannot drift apart.
    expect(
      screen.getByRole('button', { name: `${PROJECTS[0].title} ${PROJECTS[0].date}` }),
    ).toBeInTheDocument();
  });

  it('makes the hit target a sibling overlay rather than a wrapper round the text', () => {
    // Regression: the button used to wrap the head row, so it was one line tall
    // inside an 11.8cqw pill and only the title and date were clickable — while
    // the hover ring promised the whole shape. Being a sibling is what lets CSS
    // stretch it over the pill; a wrapper can only ever be as tall as its text.
    renderDeck();
    const hit = focusedPill();
    expect(hit).toBeEmptyDOMElement();
    expect(hit).not.toContainElement(screen.getByText(PROJECTS[0].title));
    expect(hit.parentElement).toHaveClass('pill');
  });
});

describe('opening and closing a project', () => {
  it('opens the focused pill on click and shows its details', async () => {
    renderDeck();
    await userEvent.click(focusedPill());
    // Scoped to the open card: every project's body is in the DOM for the morph,
    // and roles like "Solo build" are deliberately shared between projects.
    const card = within(focusedPill().closest('.pill') as HTMLElement);
    expect(card.getByText(PROJECTS[0].description)).toBeVisible();
    expect(card.getByText(PROJECTS[0].role)).toBeVisible();
    for (const chip of PROJECTS[0].stack) expect(card.getByText(chip)).toBeVisible();
    expect(card.getByRole('link', { name: PROJECTS[0].linkLabel ?? /view project/i })).toHaveAttribute(
      'href',
      PROJECTS[0].url,
    );
  });

  it('closes on the cross', async () => {
    renderDeck();
    await userEvent.click(focusedPill());
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    renderDeck();
    await userEvent.click(focusedPill());
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('consumes Escape, so the section overlay does not close as well', async () => {
    renderDeck();
    await userEvent.click(focusedPill());
    const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
  });

  it('closes on a click outside the card', async () => {
    renderDeck();
    await userEvent.click(focusedPill());
    await userEvent.click(screen.getByTestId('deck-host'));
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('does not close when the click lands inside the card', async () => {
    renderDeck();
    await userEvent.click(focusedPill());
    await userEvent.click(screen.getByText(PROJECTS[0].description));
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('opens only one project at a time', async () => {
    renderDeck();
    await userEvent.click(focusedPill());
    expect(screen.getAllByRole('button', { name: /close/i })).toHaveLength(1);
  });

  it('puts the other pills out of reach while a card is open', async () => {
    // Regression: they were only faded to opacity 0, which still takes clicks
    // and still holds a tab stop. Clicking beside the open card hit an invisible
    // neighbour — swallowing the click-outside-to-close, because the target was
    // inside a .pill, and setting a travel target the deck ran on close.
    renderDeck();
    await userEvent.click(focusedPill());

    await waitFor(() => {
      const hidden = [...document.querySelectorAll<HTMLElement>('.pill-slot')].filter(
        (slot) => slot.style.visibility === 'hidden',
      );
      expect(hidden).toHaveLength(PROJECTS.length - 1);
    });

    // Only the open card's own two controls are reachable.
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('hides the body from assistive tech while the pill is closed', () => {
    renderDeck();
    // Every project's blurb is in the DOM from the start, for the morph to work.
    // Closed pills must not read them out.
    const closedBody = screen.getByText(PROJECTS[1].description).closest('.pill-body');
    expect(closedBody).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('reduced motion', () => {
  // jsdom does not implement matchMedia at all, which is why the hooks guard on
  // its existence — so this stubs the global rather than spying on it.
  const stubMatchMedia = (matches: (query: string) => boolean) =>
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: matches(query),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }));

  afterEach(() => vi.unstubAllGlobals());

  it('marks the deck so the stylesheet can shorten the morph', () => {
    stubMatchMedia((query) => query.includes('prefers-reduced-motion'));
    renderDeck();
    expect(screen.getByTestId('deck-host')).toHaveClass('is-reduced');
  });

  it('leaves the deck unmarked when no preference is set', () => {
    stubMatchMedia(() => false);
    renderDeck();
    expect(screen.getByTestId('deck-host')).not.toHaveClass('is-reduced');
  });
});
