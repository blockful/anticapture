import {
  FeedEventType as GraphFeedEventType,
  FeedRelevance as GraphFeedEventRelevance,
} from "@anticapture/graphql-client";
import type { Address } from "viem";

export {
  GraphFeedEventRelevance as FeedEventRelevance,
  GraphFeedEventType as FeedEventType,
};

export interface VoteDetail {
  voter: Address;
  votingPower: string;
  proposalId: string;
  title: string | null;
  support: number;
}

export interface ProposalDetail {
  id: string;
  title: string;
  proposer: Address;
  votingPower: string;
}

export interface ProposalExtendedDetail {
  id: string;
  title: string;
  endBlock: number;
  endTimestamp: number;
  proposer: Address;
}

export interface TransferDetail {
  from: Address;
  to: Address;
  amount: string;
}

export interface DelegationDetail {
  delegator: Address;
  delegate: Address;
  previousDelegate: Address | null;
  amount: string;
}

export interface DelegationVotesChangedDetail {
  delta: string;
  deltaMod: string;
  delegate: Address;
}

type FeedEventBase = {
  logIndex: number;
  relevance: GraphFeedEventRelevance;
  timestamp: number;
  txHash: string;
  value?: string | null;
};

export type FeedEvent =
  | (FeedEventBase & {
      type: GraphFeedEventType.Vote;
      metadata?: VoteDetail;
    })
  | (FeedEventBase & {
      type: GraphFeedEventType.Proposal;
      metadata?: ProposalDetail;
    })
  | (FeedEventBase & {
      type: GraphFeedEventType.ProposalExtended;
      metadata?: ProposalExtendedDetail;
    })
  | (FeedEventBase & {
      type: GraphFeedEventType.Transfer;
      metadata?: TransferDetail;
    })
  | (FeedEventBase & {
      type: GraphFeedEventType.Delegation;
      metadata?: DelegationDetail;
    });
// | (FeedEventBase & {
//     type: Query_FeedEvents_Items_Items_Type.DelegationVotesChanged;
//     metadata?: DelegationVotesChangedDetail;
//   });

export interface ActivityFeedFilters {
  limit?: number;
  offset?: number;
  sortOrder?: "asc" | "desc";
  fromTimestamp?: number;
  toTimestamp?: number;
  type?: GraphFeedEventType;
  relevance?: GraphFeedEventRelevance;
}

export interface ActivityFeedFilterState {
  sortOrder: "desc" | "asc";
  type?: GraphFeedEventType;
  relevance?: GraphFeedEventRelevance;
  fromDate: string;
  toDate: string;
}
