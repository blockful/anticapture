import { Address } from "viem";

import {
  Query_FeedEvents_Items_Items_Relevance,
  Query_FeedEvents_Items_Items_Type,
} from "@anticapture/graphql-client";

export type FeedEventRelevance = Query_FeedEvents_Items_Items_Relevance;
export const FeedEventRelevance = Query_FeedEvents_Items_Items_Relevance;
export type FeedEventType = Query_FeedEvents_Items_Items_Type;
export const FeedEventType = Query_FeedEvents_Items_Items_Type;

export interface VoteDetail {
  voter: Address;
  votingPower: string;
  proposalId: string;
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
  logIndex: Number;
  relevance: Query_FeedEvents_Items_Items_Relevance;
  timestamp: number;
  txHash: string;
  value?: string | null;
};

export type FeedEvent =
  | (FeedEventBase & {
      type: Query_FeedEvents_Items_Items_Type.Vote;
      metadata?: VoteDetail;
    })
  | (FeedEventBase & {
      type: Query_FeedEvents_Items_Items_Type.Proposal;
      metadata?: ProposalDetail;
    })
  | (FeedEventBase & {
      type: Query_FeedEvents_Items_Items_Type.ProposalExtended;
      metadata?: ProposalExtendedDetail;
    })
  | (FeedEventBase & {
      type: Query_FeedEvents_Items_Items_Type.Transfer;
      metadata?: TransferDetail;
    })
  | (FeedEventBase & {
      type: Query_FeedEvents_Items_Items_Type.Delegation;
      metadata?: DelegationDetail;
    })
  | (FeedEventBase & {
      type: Query_FeedEvents_Items_Items_Type.DelegationVotesChanged;
      metadata?: DelegationVotesChangedDetail;
    });

export interface ActivityFeedFilters {
  limit?: number;
  offset?: number;
  sortOrder?: "asc" | "desc";
  fromTimestamp?: number;
  toTimestamp?: number;
  type?: Query_FeedEvents_Items_Items_Type;
  relevance?: Query_FeedEvents_Items_Items_Relevance;
}

export interface ActivityFeedFilterState {
  sortOrder: "desc" | "asc";
  type?: Query_FeedEvents_Items_Items_Type;
  relevance?: Query_FeedEvents_Items_Items_Relevance;
  fromDate: string;
  toDate: string;
}
