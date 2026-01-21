import * as chains from "viem/chains";

import { DaoIdEnum, FeedEventRelevanceEnum, FeedEventTypeEnum } from "./enums";
import { RELEVANCE_THRESHOLDS } from "./constants";

/**
 * Calculates the absolute difference between two numbers
 */
export function delta(a: bigint, b: bigint): bigint {
  return a > b ? a - b : b - a;
}

/**
 * Returns the minimum of two or more numbers
 */
export function min(...values: bigint[]): bigint {
  if (values.length === 0) {
    throw new Error("At least one value must be provided");
  }
  return values.reduce((min, value) => (value < min ? value : min));
}

/**
 * Returns the maximum of two or more numbers
 */
export function max(...values: bigint[]): bigint {
  if (values.length === 0) {
    throw new Error("At least one value must be provided");
  }
  return values.reduce((max, value) => (value > max ? value : max));
}

export function getChain(chainId: number): chains.Chain | undefined {
  return Object.values(chains).find((chain) => chain.id === chainId);
}

/**
 * Computes the relevance level for a feed event based on the value and DAO thresholds.
 * If thresholds are not configured for the DAO, returns "none".
 */
export function computeRelevance(
  daoId: DaoIdEnum,
  eventType:
    | FeedEventTypeEnum.TRANSFER
    | FeedEventTypeEnum.DELEGATION
    | FeedEventTypeEnum.VOTE,
  value: bigint,
): FeedEventRelevanceEnum {
  const thresholds = RELEVANCE_THRESHOLDS[daoId];
  if (!thresholds) {
    return FeedEventRelevanceEnum.NONE;
  }

  const eventThresholds = thresholds[eventType];
  if (!eventThresholds) {
    return FeedEventRelevanceEnum.NONE;
  }

  if (value >= eventThresholds.high) {
    return FeedEventRelevanceEnum.HIGH;
  }
  if (value >= eventThresholds.medium) {
    return FeedEventRelevanceEnum.MEDIUM;
  }
  if (value >= eventThresholds.low) {
    return FeedEventRelevanceEnum.LOW;
  }
  return FeedEventRelevanceEnum.NONE;
}
