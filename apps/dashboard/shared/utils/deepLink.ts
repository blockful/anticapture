/**
 * Deep links to a block of a page: `/ens/revenue#renewal-rate-by-year`.
 *
 * A block is marked with `deepLinkTarget(slug)`, its title is a
 * `DeepLinkTitle`, and the page mounts `DeepLinkArrival` once. The target is
 * found by attribute, not by `id`: with an `id` the browser jumps to the
 * block before the page has its data, and the block then moves as the cards
 * above it load.
 */

/** Marks an element as the block a deep link points at. */
export const DEEP_LINK_ATTRIBUTE = "data-deep-link";

/** Set on the block while its border pulses (see globals.css). */
export const DEEP_LINK_PULSE_ATTRIBUTE = "data-deep-link-pulse";

/** Lowercase words joined by single hyphens, starting with a letter. */
const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export const isDeepLinkSlug = (value: string): boolean =>
  SLUG_PATTERN.test(value);

/** Props that make an element the target of `slug`. */
export const deepLinkTarget = (slug: string) => ({
  [DEEP_LINK_ATTRIBUTE]: slug,
});

/**
 * The slug a URL hash names, or null when the hash is empty or is not a
 * slug. Only a slug is ever put in a selector.
 */
export function slugFromHash(hash: string): string | null {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  return isDeepLinkSlug(value) ? value : null;
}

/** CSS selector of the block `slug` points at. */
export const deepLinkSelector = (slug: string): string =>
  `[${DEEP_LINK_ATTRIBUTE}="${slug}"]`;

/** The page at `href`, pointing at `slug`: same path and query, new hash. */
export function buildDeepLinkUrl(href: string, slug: string): string {
  const url = new URL(href);
  url.hash = slug;
  return url.toString();
}

/**
 * Where a block rests after the scroll. A block that fits comfortably is
 * centred, so what surrounds it stays in view; a tall one starts at the top,
 * so its title is not pushed off screen.
 */
export function pickScrollBlock(
  targetHeight: number,
  viewportHeight: number,
): "center" | "start" {
  return targetHeight > viewportHeight * 0.6 ? "start" : "center";
}
