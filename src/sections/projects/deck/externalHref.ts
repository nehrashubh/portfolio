/**
 * The url if it is safe to link to, otherwise undefined.
 *
 * http(s) is an external link. A site fragment such as "#writeups/massagold"
 * is an internal one. Anything else — a `javascript:` from a bad data file,
 * or an empty string for private work — yields no link at all.
 */
export function externalHref(url: string): string | undefined {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
}

export function internalHref(url: string): string | undefined {
  const trimmed = url.trim();
  return /^#[a-z]+(?:\/[a-z0-9_-]+)?$/i.test(trimmed) ? trimmed : undefined;
}

export function linkHref(url: string): { href: string; external: boolean } | undefined {
  const external = externalHref(url);
  if (external) return { href: external, external: true };
  const internal = internalHref(url);
  if (internal) return { href: internal, external: false };
  return undefined;
}
