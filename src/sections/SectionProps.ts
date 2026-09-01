export interface SectionProps {
  /** Mirrors prefers-reduced-motion. Sections may also read the shared hook. */
  reducedMotion: boolean
  /**
   * The thing the URL asked for inside this section — `#writeups/massagold`
   * gives the Writeups section "massagold". Each section decides what an
   * item means for it: open the reader, focus the card, fly to the stop.
   */
  item?: string
}
