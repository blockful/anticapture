import { parseEther } from "viem";
import { FeedEventType, FeedRelevance } from "./constants";
import { DaoIdEnum } from "./enums";

interface RelevanceThresholds {
  [FeedRelevance.LOW]: bigint;
  [FeedRelevance.MEDIUM]: bigint;
  [FeedRelevance.HIGH]: bigint;
}

type EventRelevanceMap = Record<FeedEventType, RelevanceThresholds>;

function thresholds(low: bigint, med: bigint, high: bigint): RelevanceThresholds {
  return {
    [FeedRelevance.LOW]: low,
    [FeedRelevance.MEDIUM]: med,
    [FeedRelevance.HIGH]: high,
  };
}

/**
 * Builds an EventRelevanceMap where transfer, delegation, and vote events
 * share the same thresholds, while proposal events are always relevant (0).
 *
 * For ERC-20 tokens (decimals = 18), pass values through parseEther.
 * For ERC-721 tokens (e.g. NOUNS, decimals = 0), pass raw bigints.
 */
function daoThresholds(
  low: bigint,
  med: bigint,
  high: bigint,
): EventRelevanceMap {
  const t = thresholds(low, med, high);
  return {
    [FeedEventType.TRANSFER]: t,
    [FeedEventType.DELEGATION]: t,
    [FeedEventType.VOTE]: t,
    [FeedEventType.PROPOSAL]: thresholds(0n, 0n, 0n),
    [FeedEventType.PROPOSAL_EXTENDED]: thresholds(0n, 0n, 0n),
  };
}

const DAO_RELEVANCE_THRESHOLDS: Record<DaoIdEnum, EventRelevanceMap> = {
  [DaoIdEnum.COMP]: daoThresholds(
    parseEther("1500"),
    parseEther("15000"),
    parseEther("30000"),
  ),
  [DaoIdEnum.ENS]: daoThresholds(
    parseEther("2000"),
    parseEther("20000"),
    parseEther("40000"),
  ),
  [DaoIdEnum.NOUNS]: daoThresholds(2n, 4n, 6n),
  [DaoIdEnum.SCR]: daoThresholds(
    parseEther("4000"),
    parseEther("44000"),
    parseEther("88000"),
  ),
  [DaoIdEnum.OBOL]: daoThresholds(
    parseEther("13000"),
    parseEther("136000"),
    parseEther("270000"),
  ),
  [DaoIdEnum.UNI]: daoThresholds(
    parseEther("118000"),
    parseEther("1180000"),
    parseEther("2360000"),
  ),
  [DaoIdEnum.GTC]: daoThresholds(
    parseEther("4800"),
    parseEther("48000"),
    parseEther("96000"),
  ),
  [DaoIdEnum.ARB]: daoThresholds(
    parseEther("1000"),
    parseEther("100000"),
    parseEther("1000000"),
  ),
  [DaoIdEnum.OP]: daoThresholds(
    parseEther("1000"),
    parseEther("100000"),
    parseEther("1000000"),
  ),
  [DaoIdEnum.ZK]: daoThresholds(
    parseEther("1000"),
    parseEther("100000"),
    parseEther("1000000"),
  ),
};

export function getDaoRelevanceThreshold(daoId: DaoIdEnum): EventRelevanceMap {
  return DAO_RELEVANCE_THRESHOLDS[daoId];
}
