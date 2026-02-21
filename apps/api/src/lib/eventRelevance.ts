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

const EMPTY_THRESHOLDS = thresholds(0n, 0n, 0n);

const DAO_RELEVANCE_THRESHOLDS: Record<DaoIdEnum, EventRelevanceMap> = {
  [DaoIdEnum.COMP]: {
    [FeedEventType.TRANSFER]: thresholds(parseEther("1500"), parseEther("15000"), parseEther("30000")),
    [FeedEventType.DELEGATION]: thresholds(parseEther("1500"), parseEther("15000"), parseEther("30000")),
    [FeedEventType.VOTE]: thresholds(parseEther("1500"), parseEther("15000"), parseEther("30000")),
    [FeedEventType.PROPOSAL]: EMPTY_THRESHOLDS,
    [FeedEventType.PROPOSAL_EXTENDED]: EMPTY_THRESHOLDS,
  },
  [DaoIdEnum.ENS]: {
    [FeedEventType.TRANSFER]: thresholds(parseEther("2000"), parseEther("20000"), parseEther("40000")),
    [FeedEventType.DELEGATION]: thresholds(parseEther("2000"), parseEther("20000"), parseEther("40000")),
    [FeedEventType.VOTE]: thresholds(parseEther("2000"), parseEther("20000"), parseEther("40000")),
    [FeedEventType.PROPOSAL]: EMPTY_THRESHOLDS,
    [FeedEventType.PROPOSAL_EXTENDED]: EMPTY_THRESHOLDS,
  },
  [DaoIdEnum.NOUNS]: {
    [FeedEventType.TRANSFER]: thresholds(2n, 4n, 6n),
    [FeedEventType.DELEGATION]: thresholds(2n, 4n, 6n),
    [FeedEventType.VOTE]: thresholds(2n, 4n, 6n),
    [FeedEventType.PROPOSAL]: EMPTY_THRESHOLDS,
    [FeedEventType.PROPOSAL_EXTENDED]: EMPTY_THRESHOLDS,
  },
  [DaoIdEnum.SCR]: {
    [FeedEventType.TRANSFER]: thresholds(parseEther("4000"), parseEther("44000"), parseEther("88000")),
    [FeedEventType.DELEGATION]: thresholds(parseEther("4000"), parseEther("44000"), parseEther("88000")),
    [FeedEventType.VOTE]: thresholds(parseEther("4000"), parseEther("44000"), parseEther("88000")),
    [FeedEventType.PROPOSAL]: EMPTY_THRESHOLDS,
    [FeedEventType.PROPOSAL_EXTENDED]: EMPTY_THRESHOLDS,
  },
  [DaoIdEnum.OBOL]: {
    [FeedEventType.TRANSFER]: thresholds(parseEther("13000"), parseEther("136000"), parseEther("270000")),
    [FeedEventType.DELEGATION]: thresholds(parseEther("13000"), parseEther("136000"), parseEther("270000")),
    [FeedEventType.VOTE]: thresholds(parseEther("13000"), parseEther("136000"), parseEther("270000")),
    [FeedEventType.PROPOSAL]: EMPTY_THRESHOLDS,
    [FeedEventType.PROPOSAL_EXTENDED]: EMPTY_THRESHOLDS,
  },
  [DaoIdEnum.UNI]: {
    [FeedEventType.TRANSFER]: thresholds(parseEther("118000"), parseEther("1180000"), parseEther("2360000")),
    [FeedEventType.DELEGATION]: thresholds(parseEther("118000"), parseEther("1180000"), parseEther("2360000")),
    [FeedEventType.VOTE]: thresholds(parseEther("118000"), parseEther("1180000"), parseEther("2360000")),
    [FeedEventType.PROPOSAL]: EMPTY_THRESHOLDS,
    [FeedEventType.PROPOSAL_EXTENDED]: EMPTY_THRESHOLDS,
  },
  [DaoIdEnum.GTC]: {
    [FeedEventType.TRANSFER]: thresholds(parseEther("4800"), parseEther("48000"), parseEther("96000")),
    [FeedEventType.DELEGATION]: thresholds(parseEther("4800"), parseEther("48000"), parseEther("96000")),
    [FeedEventType.VOTE]: thresholds(parseEther("4800"), parseEther("48000"), parseEther("96000")),
    [FeedEventType.PROPOSAL]: EMPTY_THRESHOLDS,
    [FeedEventType.PROPOSAL_EXTENDED]: EMPTY_THRESHOLDS,
  },
  [DaoIdEnum.ARB]: {
    [FeedEventType.TRANSFER]: thresholds(parseEther("1000"), parseEther("100000"), parseEther("1000000")),
    [FeedEventType.DELEGATION]: thresholds(parseEther("1000"), parseEther("100000"), parseEther("1000000")),
    [FeedEventType.VOTE]: thresholds(parseEther("1000"), parseEther("100000"), parseEther("1000000")),
    [FeedEventType.PROPOSAL]: EMPTY_THRESHOLDS,
    [FeedEventType.PROPOSAL_EXTENDED]: EMPTY_THRESHOLDS,
  },
  [DaoIdEnum.OP]: {
    [FeedEventType.TRANSFER]: thresholds(parseEther("1000"), parseEther("100000"), parseEther("1000000")),
    [FeedEventType.DELEGATION]: thresholds(parseEther("1000"), parseEther("100000"), parseEther("1000000")),
    [FeedEventType.VOTE]: thresholds(parseEther("1000"), parseEther("100000"), parseEther("1000000")),
    [FeedEventType.PROPOSAL]: EMPTY_THRESHOLDS,
    [FeedEventType.PROPOSAL_EXTENDED]: EMPTY_THRESHOLDS,
  },
  [DaoIdEnum.ZK]: {
    [FeedEventType.TRANSFER]: thresholds(parseEther("1000"), parseEther("100000"), parseEther("1000000")),
    [FeedEventType.DELEGATION]: thresholds(parseEther("1000"), parseEther("100000"), parseEther("1000000")),
    [FeedEventType.VOTE]: thresholds(parseEther("1000"), parseEther("100000"), parseEther("1000000")),
    [FeedEventType.PROPOSAL]: EMPTY_THRESHOLDS,
    [FeedEventType.PROPOSAL_EXTENDED]: EMPTY_THRESHOLDS,
  },
};

export function getDaoRelevanceThreshold(daoId: DaoIdEnum): EventRelevanceMap {
  return DAO_RELEVANCE_THRESHOLDS[daoId];
}
