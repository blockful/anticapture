import { describe, expect, it } from "vitest";

import { decodeFractionalVotes, voteWeightByChoice } from "./vote-support";

const uint128 = (value: bigint) => value.toString(16).padStart(32, "0");
const packed = (against: bigint, forVotes: bigint, abstain: bigint) =>
  `0x${uint128(against)}${uint128(forVotes)}${uint128(abstain)}` as const;

describe("voteWeightByChoice", () => {
  it.each([
    [0, { againstVotes: 1000n, forVotes: 0n, abstainVotes: 0n }],
    [1, { againstVotes: 0n, forVotes: 1000n, abstainVotes: 0n }],
    [2, { againstVotes: 0n, forVotes: 0n, abstainVotes: 1000n }],
  ])("puts the whole weight on support %i", (support, expected) => {
    expect(voteWeightByChoice({ support, weight: 1000n })).toEqual(expected);
  });

  it("decodes a fractional ballot packed as three uint128s", () => {
    expect(
      voteWeightByChoice({
        support: 255,
        weight: 6n,
        params: packed(1n, 2n, 3n),
      }),
    ).toEqual({ againstVotes: 1n, forVotes: 2n, abstainVotes: 3n });
  });
});

describe("decodeFractionalVotes", () => {
  it("contributes nothing for an empty or malformed payload", () => {
    const empty = { againstVotes: 0n, forVotes: 0n, abstainVotes: 0n };
    expect(decodeFractionalVotes(undefined)).toEqual(empty);
    expect(decodeFractionalVotes("0x")).toEqual(empty);
    expect(decodeFractionalVotes("0x1234")).toEqual(empty);
  });
});
