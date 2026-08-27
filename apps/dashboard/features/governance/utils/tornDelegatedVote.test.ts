import type { Address } from "viem";

import { buildTornDelegatedVoteFrom } from "@/features/governance/utils/tornDelegatedVote";

const VOTER: Address = "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa";
const DELEGATOR_ONE: Address = "0xabcabcabcabcabcabcabcabcabcabcabcabcabca";
const DELEGATOR_TWO: Address = "0x2222222222222222222222222222222222222222";

describe("buildTornDelegatedVoteFrom", () => {
  it("keeps delegators other than the voter", () => {
    expect(
      buildTornDelegatedVoteFrom(VOTER, [DELEGATOR_ONE, DELEGATOR_TWO]),
    ).toEqual([DELEGATOR_ONE, DELEGATOR_TWO]);
  });

  it("excludes the voter regardless of casing", () => {
    // The delegators query returns self-delegations (an undelegated account
    // is recorded as its own delegate); castDelegatedVote reverts on them.
    expect(
      buildTornDelegatedVoteFrom(VOTER, [
        DELEGATOR_ONE,
        VOTER.toLowerCase() as Address,
      ]),
    ).toEqual([DELEGATOR_ONE]);
  });

  it("returns an empty list when the voter is the only entry, routing to castVote", () => {
    expect(buildTornDelegatedVoteFrom(VOTER, [VOTER])).toEqual([]);
  });

  it("deduplicates delegators case-insensitively, keeping the first occurrence", () => {
    expect(
      buildTornDelegatedVoteFrom(VOTER, [
        DELEGATOR_ONE,
        "0xABCabcABCabcABCabcABCabcABCabcABCabcABCA" as Address,
        DELEGATOR_TWO,
      ]),
    ).toEqual([DELEGATOR_ONE, DELEGATOR_TWO]);
  });
});
