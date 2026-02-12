import { parseEther } from "viem";
import {  FeedEventType, FeedRelevance } from "./constants";
import { DaoIdEnum } from "./enums";

export const EventRelevanceThresholds: Record<
  DaoIdEnum,
  {
    [type in keyof Omit<Record<FeedEventType, bigint>, "PROPOSAL" | "PROPOSAL_EXTENDED">]: {
      [FeedRelevance.LOW]: bigint;
      [FeedRelevance.MEDIUM]: bigint;
      [FeedRelevance.HIGH]: bigint;
    };
  }
> = {
  [DaoIdEnum.ENS]: {
    [FeedEventType.TRANSFER]: {
      [FeedRelevance.LOW]: parseEther("1000"),
      [FeedRelevance.MEDIUM]: parseEther("10000"),
      [FeedRelevance.HIGH]: parseEther("100000"),
    },
    [FeedEventType.DELEGATION]: {
      [FeedRelevance.LOW]: parseEther("1000"),
      [FeedRelevance.MEDIUM]: parseEther("10000"),
      [FeedRelevance.HIGH]: parseEther("100000"),
    },
    [FeedEventType.VOTE]: {
      [FeedRelevance.LOW]: parseEther("1000"),
      [FeedRelevance.MEDIUM]: parseEther("10000"),
      [FeedRelevance.HIGH]: parseEther("100000"),
    },
    [FeedEventType.DELEGATION_VOTES_CHANGED]: {
      [FeedRelevance.LOW]: parseEther("1000"),
      [FeedRelevance.MEDIUM]: parseEther("10000"),
      [FeedRelevance.HIGH]: parseEther("100000"),
    },
  },
  [DaoIdEnum.UNI]: {
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
  },
  [DaoIdEnum.OBOL]: {
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
  },
  [DaoIdEnum.OP]: {
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
  },
  [DaoIdEnum.SCR]: {
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
  },
  [DaoIdEnum.COMP]: {
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
  },
  [DaoIdEnum.ZK]: {
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
  },
  [DaoIdEnum.NOUNS]: {
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
  },
  [DaoIdEnum.GTC]: {
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
  },
  [DaoIdEnum.ARB]: {
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
  },
};
