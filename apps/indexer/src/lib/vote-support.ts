import { hexToBytes, type Hex } from "viem";

/**
 * OpenZeppelin fractional ballots use support 255 and pack the split in
 * `params`. A plain Bravo ballot is 0 (against), 1 (for) or 2 (abstain).
 */
export const FRACTIONAL_VOTE_SUPPORT = 255;

export type VoteWeights = {
  againstVotes: bigint;
  forVotes: bigint;
  abstainVotes: bigint;
};

const EMPTY_WEIGHTS: VoteWeights = {
  againstVotes: 0n,
  forVotes: 0n,
  abstainVotes: 0n,
};

/**
 * Splits a ballot into the three proposal counters.
 * Fractional params are `abi.encodePacked(uint128 against, uint128 for, uint128 abstain)`.
 * A malformed payload contributes nothing instead of throwing, so one bad log
 * cannot stall the indexer.
 */
export const voteWeightByChoice = (input: {
  support: number;
  weight: bigint;
  params?: Hex;
}): VoteWeights => {
  if (input.support === FRACTIONAL_VOTE_SUPPORT) {
    return decodeFractionalVotes(input.params);
  }

  return {
    againstVotes: input.support === 0 ? input.weight : 0n,
    forVotes: input.support === 1 ? input.weight : 0n,
    abstainVotes: input.support === 2 ? input.weight : 0n,
  };
};

export const decodeFractionalVotes = (params: Hex | undefined): VoteWeights => {
  if (!params || params === "0x") return EMPTY_WEIGHTS;

  const bytes = hexToBytes(params);
  if (bytes.length !== 48) return EMPTY_WEIGHTS;

  return {
    againstVotes: readUint128(bytes, 0),
    forVotes: readUint128(bytes, 16),
    abstainVotes: readUint128(bytes, 32),
  };
};

const readUint128 = (bytes: Uint8Array, offset: number): bigint => {
  let value = 0n;
  for (let i = 0; i < 16; i++) {
    value = (value << 8n) + BigInt(bytes[offset + i] ?? 0);
  }
  return value;
};
