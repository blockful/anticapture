import { getAddress, isAddress } from "viem";

/** True for any address-shaped string, whatever its capitalization. viem's
 *  `isAddress` validates the EIP-55 checksum by default, which rejects valid
 *  addresses that were retyped or generated with the wrong casing. */
export const isAddressLike = (value: string): boolean =>
  isAddress(value.trim(), { strict: false });

/** Recomputes the checksum casing. Throws unless `isAddressLike`. */
export const toChecksumAddress = (value: string): `0x${string}` =>
  getAddress(value.trim());
