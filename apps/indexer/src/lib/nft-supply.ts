import { getAddress, zeroAddress, type Address } from "viem";

const DEAD_ADDRESS = getAddress("0x000000000000000000000000000000000000dEaD");

/**
 * An ERC-721 burn lowers totalSupply(). Mints are a Transfer from 0x0 and
 * are already counted by NounCreated, so they must not be applied again.
 */
export const isNftBurnTransfer = (from: Address, to: Address): boolean => {
  if (getAddress(from) === zeroAddress) return false;
  const toAddress = getAddress(to);
  return toAddress === zeroAddress || toAddress === DEAD_ADDRESS;
};
