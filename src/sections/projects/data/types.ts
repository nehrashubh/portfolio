export type Project = {
  title: string;
  /** Displayed verbatim in the pill's right end, e.g. "2026". */
  date: string;
  /** How you worked on it: "Solo build", "Frontend, 3 of 5". One short line. */
  role: string;
  /** A few short chips. Four maximum, or they wrap and unbalance the card. */
  stack: readonly string[];
  /** Two to three sentences; the card sets it to about three lines at 40cqw. */
  description: string;
  /** External link — a repo or a live demo. Opened in a new tab. */
  url: string;
};
