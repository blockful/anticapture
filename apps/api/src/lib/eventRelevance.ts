import { parseUnits } from "viem";
import { CONTRACT_ADDRESSES, FeedEventType, FeedRelevance } from "./constants";
import { DaoIdEnum } from "./enums";

const decimals = {
  [DaoIdEnum.ENS]: CONTRACT_ADDRESSES[DaoIdEnum.ENS].token.decimals,
  [DaoIdEnum.UNI]: CONTRACT_ADDRESSES[DaoIdEnum.UNI].token.decimals,
  [DaoIdEnum.OP]: CONTRACT_ADDRESSES[DaoIdEnum.OP].token.decimals,
  [DaoIdEnum.SCR]: CONTRACT_ADDRESSES[DaoIdEnum.SCR].token.decimals,
  [DaoIdEnum.COMP]: CONTRACT_ADDRESSES[DaoIdEnum.COMP].token.decimals,
  [DaoIdEnum.OBOL]: CONTRACT_ADDRESSES[DaoIdEnum.OBOL].token.decimals,
  [DaoIdEnum.ZK]: CONTRACT_ADDRESSES[DaoIdEnum.ZK].token.decimals,
  [DaoIdEnum.NOUNS]: CONTRACT_ADDRESSES[DaoIdEnum.NOUNS].token.decimals,
  [DaoIdEnum.GTC]: CONTRACT_ADDRESSES[DaoIdEnum.GTC].token.decimals,
  [DaoIdEnum.ARB]: CONTRACT_ADDRESSES[DaoIdEnum.ARB].token.decimals,
} as const;

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
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.ENS]),
      [FeedRelevance.MEDIUM]: parseUnits("10000", decimals[DaoIdEnum.ENS]),
      [FeedRelevance.HIGH]: parseUnits("100000", decimals[DaoIdEnum.ENS]),
    },
    [FeedEventType.DELEGATION]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.ENS]),
      [FeedRelevance.MEDIUM]: parseUnits("10000", decimals[DaoIdEnum.ENS]),
      [FeedRelevance.HIGH]: parseUnits("100000", decimals[DaoIdEnum.ENS]),
    },
    [FeedEventType.VOTE]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.ENS]),
      [FeedRelevance.MEDIUM]: parseUnits("10000", decimals[DaoIdEnum.ENS]),
      [FeedRelevance.HIGH]: parseUnits("100000", decimals[DaoIdEnum.ENS]),
    },
    [FeedEventType.DELEGATION_VOTES_CHANGED]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.ENS]),
      [FeedRelevance.MEDIUM]: parseUnits("10000", decimals[DaoIdEnum.ENS]),
      [FeedRelevance.HIGH]: parseUnits("100000", decimals[DaoIdEnum.ENS]),
    },
  },
  [DaoIdEnum.UNI]: {
    [FeedEventType.TRANSFER]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.UNI]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.UNI]),
      [FeedRelevance.HIGH]: parseUnits("1000000", decimals[DaoIdEnum.UNI]),
    },
    [FeedEventType.DELEGATION]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.UNI]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.UNI]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.UNI]),
    },
    [FeedEventType.VOTE]: {
      [FeedRelevance.LOW]: parseUnits("10000", decimals[DaoIdEnum.UNI]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.UNI]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.UNI]),
    },
    [FeedEventType.DELEGATION_VOTES_CHANGED]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.UNI]),
      [FeedRelevance.MEDIUM]: parseUnits("10000", decimals[DaoIdEnum.UNI]),
      [FeedRelevance.HIGH]: parseUnits("100000", decimals[DaoIdEnum.UNI]),
    },
  },
  [DaoIdEnum.OBOL]: {
    [FeedEventType.TRANSFER]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("1000000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.DELEGATION]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.VOTE]: {
      [FeedRelevance.LOW]: parseUnits("10000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.DELEGATION_VOTES_CHANGED]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("10000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
    },
  },
  [DaoIdEnum.OP]: {
    [FeedEventType.TRANSFER]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("1000000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.DELEGATION]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.VOTE]: {
      [FeedRelevance.LOW]: parseUnits("10000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.DELEGATION_VOTES_CHANGED]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OP]),
      [FeedRelevance.MEDIUM]: parseUnits("10000", decimals[DaoIdEnum.OP]),
      [FeedRelevance.HIGH]: parseUnits("100000", decimals[DaoIdEnum.OP]),
    },
  },
  [DaoIdEnum.SCR]: {
    [FeedEventType.TRANSFER]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("1000000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.DELEGATION]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.VOTE]: {
      [FeedRelevance.LOW]: parseUnits("10000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.DELEGATION_VOTES_CHANGED]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.SCR]),
      [FeedRelevance.MEDIUM]: parseUnits("10000", decimals[DaoIdEnum.SCR]),
      [FeedRelevance.HIGH]: parseUnits("100000", decimals[DaoIdEnum.SCR]),
    },
  },
  [DaoIdEnum.COMP]: {
    [FeedEventType.TRANSFER]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("1000000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.DELEGATION]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.VOTE]: {
      [FeedRelevance.LOW]: parseUnits("10000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.DELEGATION_VOTES_CHANGED]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.COMP]),
      [FeedRelevance.MEDIUM]: parseUnits("10000", decimals[DaoIdEnum.COMP]),
      [FeedRelevance.HIGH]: parseUnits("100000", decimals[DaoIdEnum.COMP]),
    },
  },
  [DaoIdEnum.ZK]: {
    [FeedEventType.TRANSFER]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.ZK]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.ZK]),
      [FeedRelevance.HIGH]: parseUnits("1000000", decimals[DaoIdEnum.ZK]),
    },
    [FeedEventType.DELEGATION]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.ZK]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.ZK]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.ZK]),
    },
    [FeedEventType.VOTE]: {
      [FeedRelevance.LOW]: parseUnits("10000", decimals[DaoIdEnum.ZK]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.ZK]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.ZK]),
    },
    [FeedEventType.DELEGATION_VOTES_CHANGED]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.ZK]),
      [FeedRelevance.MEDIUM]: parseUnits("10000", decimals[DaoIdEnum.ZK]),
      [FeedRelevance.HIGH]: parseUnits("100000", decimals[DaoIdEnum.ZK]),
    },
  },
  [DaoIdEnum.NOUNS]: {
    [FeedEventType.TRANSFER]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.NOUNS]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.NOUNS]),
      [FeedRelevance.HIGH]: parseUnits("1000000", decimals[DaoIdEnum.NOUNS]),
    },
    [FeedEventType.DELEGATION]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.NOUNS]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.NOUNS]),
      [FeedRelevance.HIGH]: parseUnits("1000000", decimals[DaoIdEnum.NOUNS]),
    },
    [FeedEventType.VOTE]: {
      [FeedRelevance.LOW]: parseUnits("10000", decimals[DaoIdEnum.NOUNS]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.NOUNS]),
      [FeedRelevance.HIGH]: parseUnits("1000000", decimals[DaoIdEnum.NOUNS]),
    },
    [FeedEventType.DELEGATION_VOTES_CHANGED]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.NOUNS]),
      [FeedRelevance.MEDIUM]: parseUnits("10000", decimals[DaoIdEnum.NOUNS]),
      [FeedRelevance.HIGH]: parseUnits("100000", decimals[DaoIdEnum.NOUNS]),
    },
  },
  [DaoIdEnum.GTC]: {
    [FeedEventType.TRANSFER]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("1000000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.DELEGATION]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.VOTE]: {
      [FeedRelevance.LOW]: parseUnits("10000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.OBOL]),
    },  
    [FeedEventType.DELEGATION_VOTES_CHANGED]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.GTC]),
      [FeedRelevance.MEDIUM]: parseUnits("10000", decimals[DaoIdEnum.GTC]),
      [FeedRelevance.HIGH]: parseUnits("100000", decimals[DaoIdEnum.GTC]),
    },
  },
  [DaoIdEnum.ARB]: {
    [FeedEventType.TRANSFER]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("1000000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.DELEGATION]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.VOTE]: {
      [FeedRelevance.LOW]: parseUnits("10000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.MEDIUM]: parseUnits("100000", decimals[DaoIdEnum.OBOL]),
      [FeedRelevance.HIGH]: parseUnits("500000", decimals[DaoIdEnum.OBOL]),
    },
    [FeedEventType.DELEGATION_VOTES_CHANGED]: {
      [FeedRelevance.LOW]: parseUnits("1000", decimals[DaoIdEnum.ARB]),
      [FeedRelevance.MEDIUM]: parseUnits("10000", decimals[DaoIdEnum.ARB]),
      [FeedRelevance.HIGH]: parseUnits("100000", decimals[DaoIdEnum.ARB]),
    },
  },
};
