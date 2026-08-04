import { getAddress, isAddress } from "viem";

/**
 * An Ethereum address, whatever its capitalization.
 *
 * viem's `isAddress` validates the EIP-55 checksum by default, so
 * `0x39D3F4633dE1F5E2a1e2f4d3fD6d1AAf2E9c8b71`, a perfectly good address whose
 * capitalization happens not to encode its own hash, comes back `false` and is
 * reported as not being an address at all. Nothing that reaches a form field
 * carries a reliable checksum: a hand-retyped address, one copied out of a forum
 * post, and one a model generated are all likely to be miscased, and every one
 * of them names a real account.
 *
 * Length, hex and the `0x` prefix are still enforced, so this only drops the
 * checksum, which is a transcription safeguard rather than part of the address.
 * `toChecksumAddress` puts the casing back before anything is encoded.
 */
export const isAddressLike = (value: string): boolean =>
  isAddress(value.trim(), { strict: false });

/**
 * The checksummed form of an address.
 *
 * `getAddress` recomputes the casing from the hash rather than verifying what it
 * was given, so a miscased address normalizes instead of throwing. It still
 * throws on anything that isn't address-shaped, so guard with `isAddressLike`.
 */
export const toChecksumAddress = (value: string): `0x${string}` =>
  getAddress(value.trim());
