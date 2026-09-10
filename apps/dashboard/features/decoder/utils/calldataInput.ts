/** Strips the whitespace and newlines explorers wrap pasted input data in. */
export const normalizeCalldataInput = (value: string): string =>
  value.replace(/\s+/g, "");

/**
 * Longest calldata (in characters) that still travels in the permalink URL.
 * Proxies and servers commonly reject request lines past ~8KB, so anything
 * bigger stays in component state and the permalink affordance says so.
 */
export const PERMALINK_CALLDATA_LIMIT = 6_000;

/** 0x-prefixed hex with whole bytes: decodable input, whatever the length. */
export const isValidCalldataInput = (value: string): boolean =>
  /^0x[0-9a-fA-F]*$/.test(value) && value.length % 2 === 0;
