import { MAX_DECODE_BYTES } from "@/shared/services/decoder/decode";

/** Strips the whitespace and newlines explorers wrap pasted input data in. */
export const normalizeCalldataInput = (value: string): string =>
  value.replace(/\s+/g, "");

/**
 * Longest calldata (in characters) that still travels in the permalink URL.
 * Proxies and servers commonly reject request lines past ~8KB, so anything
 * bigger stays in component state and the permalink affordance says so.
 */
export const PERMALINK_CALLDATA_LIMIT = 6_000;

/**
 * Longest input worth holding at all: the decode byte limit written as hex
 * characters, with room for the 0x and for the whitespace an explorer paste
 * carries. Past it the decoder keeps only the selector anyway, so the extra
 * text buys nothing and costs a re-render, a re-hash and a re-encode on every
 * keystroke after it.
 */
export const MAX_CALLDATA_INPUT_CHARS = 2 * MAX_DECODE_BYTES + 1_024;

export const clampCalldataInput = (value: string): string =>
  value.length > MAX_CALLDATA_INPUT_CHARS
    ? value.slice(0, MAX_CALLDATA_INPUT_CHARS)
    : value;

/**
 * Whether this input is too long to travel in the permalink. Whitespace in an
 * explorer paste costs three characters each once encoded, so the raw length
 * undercounts and the encoding decides. The encoding runs only on inputs that
 * could still fit: `encodeURIComponent` never shrinks a string, so anything
 * already past the limit is past it, and a 128 KiB paste never pays to be
 * encoded on the way to being rejected.
 */
export const exceedsPermalinkLimit = (value: string): boolean =>
  value.length > PERMALINK_CALLDATA_LIMIT ||
  encodeURIComponent(value).length > PERMALINK_CALLDATA_LIMIT;

/** 0x-prefixed hex with whole bytes: decodable input, whatever the length. */
export const isValidCalldataInput = (value: string): boolean =>
  /^0x[0-9a-fA-F]*$/.test(value) && value.length % 2 === 0;
