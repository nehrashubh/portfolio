/**
 * Closes the card.
 *
 * Clicking outside the card closes it too, but that is invisible to anyone who
 * does not already know the convention — hence a visible affordance.
 *
 * On hover it turns 90°, which lands it as exactly the same cross: motion that
 * resolves to no change.
 */
export default function CloseCross({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="close-cross"
      aria-label="Close project details"
      onClick={(event) => {
        // The card's own click handler would otherwise see this and, on the
        // host, a stray close would race the intended one.
        event.stopPropagation();
        onClose();
      }}
    />
  );
}
