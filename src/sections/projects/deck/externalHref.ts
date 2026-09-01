/**
 * The url if it is a safe external link, otherwise undefined.
 *
 * Rejecting anything but http(s) keeps a bad data file from turning a card into
 * a `javascript:` execution vector.
 */
export function externalHref(url: string): string | undefined {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
}
