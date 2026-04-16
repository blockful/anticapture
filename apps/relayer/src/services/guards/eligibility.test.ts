import { describe, it, expect } from "vitest";
import { getAddress } from "viem";

import { EligibilityService } from "./eligibility";
import type { ChainStateService } from "../chain/chain-state";

const VOTER = getAddress("0x3333333333333333333333333333333333333333");

function createStubChainState(
  overrides: Partial<ChainStateService> = {},
): ChainStateService {
  return {
    getVotingPower: async () => 0n,
    getProposalState: async () => 0,
    hasVoted: async () => false,
    getDelegationNonce: async () => 0n,
    getCurrentDelegate: async () =>
      getAddress("0x0000000000000000000000000000000000000000"),
    getGovernorName: async () => "TestGovernor",
    getTokenName: async () => "TestToken",
    ...overrides,
  } as ChainStateService;
}

describe("EligibilityService", () => {
  describe("assertCanVote", () => {
    it("passes when voting power meets threshold", async () => {
      const chainState = createStubChainState({
        getVotingPower: async () => 1000n,
      });
      const service = new EligibilityService(chainState, {
        minVotingPower: 1000n,
        delegationCooldownDays: 7,
      });

      await expect(service.assertCanVote(VOTER)).resolves.toBeUndefined();
    });

    it("throws when voting power is below threshold", async () => {
      const chainState = createStubChainState({
        getVotingPower: async () => 999n,
      });
      const service = new EligibilityService(chainState, {
        minVotingPower: 1000n,
        delegationCooldownDays: 7,
      });

      await expect(service.assertCanVote(VOTER)).rejects.toThrow(
        "minimum voting power",
      );
    });
  });

  describe("assertCanDelegate", () => {
    it("passes when voting power meets threshold", async () => {
      const chainState = createStubChainState({
        getVotingPower: async () => 5000n,
      });
      const service = new EligibilityService(chainState, {
        minVotingPower: 1000n,
        delegationCooldownDays: 7,
      });

      await expect(service.assertCanDelegate(VOTER)).resolves.toBeUndefined();
    });

    it("throws when voting power is below threshold", async () => {
      const chainState = createStubChainState({
        getVotingPower: async () => 0n,
      });
      const service = new EligibilityService(chainState, {
        minVotingPower: 1000n,
        delegationCooldownDays: 7,
      });

      await expect(service.assertCanDelegate(VOTER)).rejects.toThrow(
        "minimum voting power",
      );
    });
  });
});
