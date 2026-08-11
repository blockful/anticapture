import { getAddress, isAddress } from "viem";

export const isAddressLike = (value: string): boolean =>
  isAddress(value.trim(), { strict: false });

export const toChecksumAddress = (value: string): `0x${string}` =>
  getAddress(value.trim());
