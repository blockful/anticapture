import { isAddress, isHex, type Address, type Hex } from "viem";

/**
 * Runtime shape checks for decoded ABI values. Everything the decoder walks
 * came out of `decodeFunctionData` against an ABI it did not choose: an
 * unverified contract can resolve a colliding selector to any shape at all,
 * so nothing may be asserted into a type, only tested into one.
 */

/** A plain object, never an array or null: how viem gives a named tuple. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * An address as the decoder may meet one. The checksum is not required:
 * decoded values arrive checksummed, hand-written calldata does not, and both
 * are addresses the reader is entitled to see.
 */
export const isAddressValue = (value: unknown): value is Address =>
  typeof value === "string" && isAddress(value, { strict: false });

/** 0x-prefixed hex, whatever its length. */
export const isHexValue = (value: unknown): value is Hex => isHex(value);

/** Drops the misses of a `map` over a partial parser. */
export const isPresent = <T>(value: T | null): value is T => value !== null;
