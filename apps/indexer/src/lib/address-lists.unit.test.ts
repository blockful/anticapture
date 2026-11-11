import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

import { DaoIdEnum } from "@/lib/enums";

import {
  BurningAddresses,
  CEXAddresses,
  CONTRACT_ADDRESSES,
  DEXAddresses,
  LendingAddresses,
  TreasuryAddresses,
} from "./constants";

const normalize = (list: Record<string, string>) =>
  Object.values(list).map((address) => getAddress(address));

const duplicateAddresses = (
  lists: Record<string, Record<string, string>>,
): string[] =>
  Object.entries(lists).flatMap(([dao, labels]) => {
    const seen = new Map<string, string>();
    const found: string[] = [];
    for (const [label, address] of Object.entries(labels)) {
      const normalized = getAddress(address);
      const previous = seen.get(normalized);
      if (previous) {
        found.push(`${dao} ${normalized} (${previous}, ${label})`);
      } else {
        seen.set(normalized, label);
      }
    }
    return found;
  });

describe("address lists", () => {
  it("lists each CEX, DEX, lending and treasury address once per DAO", () => {
    expect(duplicateAddresses(CEXAddresses)).toEqual([]);
    expect(duplicateAddresses(DEXAddresses)).toEqual([]);
    expect(duplicateAddresses(LendingAddresses)).toEqual([]);
    expect(duplicateAddresses(TreasuryAddresses)).toEqual([]);
  });

  it("does not count a lending market as treasury as well", () => {
    for (const dao of Object.values(DaoIdEnum)) {
      const treasury = new Set(normalize(TreasuryAddresses[dao]));
      for (const address of normalize(LendingAddresses[dao])) {
        expect(treasury.has(address), `${dao} ${address}`).toBe(false);
      }
    }
  });

  it("points the AAVE and ARB burn TokenContract at the indexed token", () => {
    expect(getAddress(BurningAddresses[DaoIdEnum.AAVE].TokenContract)).toBe(
      getAddress(CONTRACT_ADDRESSES[DaoIdEnum.AAVE].aave.address),
    );
    expect(getAddress(BurningAddresses[DaoIdEnum.ARB].TokenContract)).toBe(
      getAddress(CONTRACT_ADDRESSES[DaoIdEnum.ARB].token.address),
    );
  });
});
