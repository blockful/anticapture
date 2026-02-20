import { parseEther } from "viem";
import { FeedEventType, FeedRelevance } from "./constants";
import { DaoIdEnum } from "./enums";

function thresholds(low: bigint, med: bigint, high: bigint) {
  return {
    [FeedRelevance.LOW]: low,
    [FeedRelevance.MEDIUM]: med,
    [FeedRelevance.HIGH]: high,
  };
}
export function getDaoRelevanceThreshold(daoId: DaoIdEnum): {
  [type in keyof Record<FeedEventType, bigint>]: {
    [FeedRelevance.LOW]: bigint;
    [FeedRelevance.MEDIUM]: bigint;
    [FeedRelevance.HIGH]: bigint;
  };
} {
  switch (daoId) {
    case DaoIdEnum.NOUNS:
      return {
        [FeedEventType.TRANSFER]: thresholds(1n, 3n, 10n),
        [FeedEventType.DELEGATION]: thresholds(1n, 3n, 10n),
        [FeedEventType.VOTE]: thresholds(1n, 5n, 20n),
        // [FeedEventType.DELEGATION_VOTES_CHANGED]: thresholds(1n, 3n, 10n),
        [FeedEventType.PROPOSAL]: thresholds(0n, 0n, 0n),
        [FeedEventType.PROPOSAL_EXTENDED]: thresholds(0n, 0n, 0n),
      };
    default:
      return {
        [FeedEventType.TRANSFER]: thresholds(
          parseEther("1000"),
          parseEther("100000"),
          parseEther("1000000"),
        ),
        [FeedEventType.DELEGATION]: thresholds(
          parseEther("1000"),
          parseEther("100000"),
          parseEther("500000"),
        ),
        [FeedEventType.VOTE]: thresholds(
          parseEther("10000"),
          parseEther("100000"),
          parseEther("500000"),
        ),
        // [FeedEventType.DELEGATION_VOTES_CHANGED]: thresholds(
        //   parseEther("1000"),
        //   parseEther("10000"),
        //   parseEther("100000"),
        // ),
        [FeedEventType.PROPOSAL]: thresholds(0n, 0n, 0n),
        [FeedEventType.PROPOSAL_EXTENDED]: thresholds(0n, 0n, 0n),
      };
  }
}
