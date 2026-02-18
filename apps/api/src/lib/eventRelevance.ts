import { parseEther } from "viem";
import { FeedEventType, FeedRelevance } from "./constants";
import { DaoIdEnum } from "./enums";

export function getDaoRelevanceThreshold(daoId: DaoIdEnum): {
  [type in keyof Omit<
    Record<FeedEventType, bigint>,
    "PROPOSAL" | "PROPOSAL_EXTENDED"
  >]: {
    [FeedRelevance.LOW]: bigint;
    [FeedRelevance.MEDIUM]: bigint;
    [FeedRelevance.HIGH]: bigint;
  };
} {
  switch (daoId) {
    case DaoIdEnum.NOUNS:
      return {
        [FeedEventType.TRANSFER]: {
          [FeedRelevance.LOW]: 1n,
          [FeedRelevance.MEDIUM]: 3n,
          [FeedRelevance.HIGH]: 10n,
        },
        [FeedEventType.DELEGATION]: {
          [FeedRelevance.LOW]: 1n,
          [FeedRelevance.MEDIUM]: 3n,
          [FeedRelevance.HIGH]: 10n,
        },
        [FeedEventType.VOTE]: {
          [FeedRelevance.LOW]: 1n,
          [FeedRelevance.MEDIUM]: 5n,
          [FeedRelevance.HIGH]: 20n,
        },
        [FeedEventType.DELEGATION_VOTES_CHANGED]: {
          [FeedRelevance.LOW]: 1n,
          [FeedRelevance.MEDIUM]: 3n,
          [FeedRelevance.HIGH]: 10n,
        },
      };
    default:
      return {
        [FeedEventType.TRANSFER]: {
          [FeedRelevance.LOW]: parseEther("1000"),
          [FeedRelevance.MEDIUM]: parseEther("100000"),
          [FeedRelevance.HIGH]: parseEther("1000000"),
        },
        [FeedEventType.DELEGATION]: {
          [FeedRelevance.LOW]: parseEther("1000"),
          [FeedRelevance.MEDIUM]: parseEther("100000"),
          [FeedRelevance.HIGH]: parseEther("500000"),
        },
        [FeedEventType.VOTE]: {
          [FeedRelevance.LOW]: parseEther("10000"),
          [FeedRelevance.MEDIUM]: parseEther("100000"),
          [FeedRelevance.HIGH]: parseEther("500000"),
        },
        [FeedEventType.DELEGATION_VOTES_CHANGED]: {
          [FeedRelevance.LOW]: parseEther("1000"),
          [FeedRelevance.MEDIUM]: parseEther("10000"),
          [FeedRelevance.HIGH]: parseEther("100000"),
        },
      };
  }
}
