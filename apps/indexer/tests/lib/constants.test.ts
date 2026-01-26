// Jest is used as the test runner in this project
import {
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  BurningAddresses,
  TreasuryAddresses,
  CONTRACT_ADDRESSES,
} from "../../src/lib/constants";
import { isAddress } from "viem";

const extractAddresses = (
  obj: Record<string, Record<string, string>>,
): string[] => {
  return Object.values(obj).flatMap((daoAddresses) =>
    Object.values(daoAddresses),
  );
};

const extractContractAddresses = (obj: typeof CONTRACT_ADDRESSES): string[] => {
  const addresses: string[] = [];
  Object.values(obj).forEach((dao) => {
    if (dao.token?.address) addresses.push(dao.token.address);
    if ("governor" in dao && dao.governor?.address)
      addresses.push(dao.governor.address);
    if ("governorAlpha" in dao && dao.governorAlpha?.address)
      addresses.push(dao.governorAlpha.address);
    if ("auction" in dao && dao.auction?.address)
      addresses.push(dao.auction.address);
  });
  return addresses;
};

describe("constants addresses should be lowercase and valid", () => {
  /**
   * Ponder 0.12+ returns all event addresses in lowercase.
   * These tests ensure consistency with the indexer's event handling
   * and validate that all addresses are valid Ethereum addresses.
   */

  it("CONTRACT_ADDRESSES should all be lowercase and valid", () => {
    const addresses = extractContractAddresses(CONTRACT_ADDRESSES);
    addresses.forEach((addr) => {
      expect(addr).toBe(addr.toLowerCase());
      expect(isAddress(addr, { strict: false })).toBe(true);
    });
  });

  it("TreasuryAddresses should all be lowercase and valid", () => {
    const addresses = extractAddresses(
      TreasuryAddresses as Record<string, Record<string, string>>,
    );
    addresses.forEach((addr) => {
      expect(addr).toBe(addr.toLowerCase());
      expect(isAddress(addr, { strict: false })).toBe(true);
    });
  });

  it("CEXAddresses should all be lowercase and valid", () => {
    const addresses = extractAddresses(
      CEXAddresses as Record<string, Record<string, string>>,
    );
    addresses.forEach((addr) => {
      expect(addr).toBe(addr.toLowerCase());
      expect(isAddress(addr, { strict: false })).toBe(true);
    });
  });

  it("DEXAddresses should all be lowercase and valid", () => {
    const addresses = extractAddresses(
      DEXAddresses as Record<string, Record<string, string>>,
    );
    addresses.forEach((addr) => {
      expect(addr).toBe(addr.toLowerCase());
      expect(isAddress(addr, { strict: false })).toBe(true);
    });
  });

  it("LendingAddresses should all be lowercase and valid", () => {
    const addresses = extractAddresses(
      LendingAddresses as Record<string, Record<string, string>>,
    );
    addresses.forEach((addr) => {
      expect(addr).toBe(addr.toLowerCase());
      expect(isAddress(addr, { strict: false })).toBe(true);
    });
  });

  it("BurningAddresses should all be lowercase and valid", () => {
    const addresses: string[] = [];
    Object.values(BurningAddresses).forEach((dao) => {
      // ZeroAddress is a viem constant, skip it
      if (dao.Dead) addresses.push(dao.Dead);
      if (dao.TokenContract) addresses.push(dao.TokenContract);
      if (dao.Airdrop) addresses.push(dao.Airdrop);
    });
    addresses.forEach((addr) => {
      expect(addr).toBe(addr.toLowerCase());
      expect(isAddress(addr, { strict: false })).toBe(true);
    });
  });
});
