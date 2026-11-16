import { getAddress, zeroAddress, type Address } from "viem";

/**
 * An ERC-721 `_burn` is a Transfer to the zero address and is the only
 * transfer that lowers totalSupply(). A transfer to 0x…dEaD is an ordinary
 * transfer for the contract. Mints are a Transfer from 0x0 and are already
 * counted by NounCreated, so they must not be applied again.
 */
export const isNftBurnTransfer = (from: Address, to: Address): boolean =>
  getAddress(from) !== zeroAddress && getAddress(to) === zeroAddress;
