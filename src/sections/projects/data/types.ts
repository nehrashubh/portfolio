export type Project = {
  /** Stable id for deep links: #projects/<slug>. */
  slug: string;
  title: string;
  /** Displayed verbatim in the pill's right end, e.g. "2026". */
  date: string;
  /** How you worked on it: "Solo build", "Frontend, 3 of 5". One short line. */
  role: string;
  /** A few short chips. Four maximum, or they wrap and unbalance the card. */
  stack: readonly string[];
  /** Two to three sentences; the card sets it to about three lines at 40cqw. */
  description: string;
  /**
   * Where the card's link goes. An http(s) URL opens in a new tab; a hash
   * like "#writeups/massagold" travels within the site; empty means no link,
   * which is right for private client work.
   */
  url: string;
  /** Link text. Defaults to "View project". */
  linkLabel?: string;
};
