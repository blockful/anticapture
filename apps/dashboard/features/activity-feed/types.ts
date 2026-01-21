export type FeedEventType = "vote" | "proposal" | "transfer" | "delegation";
export type FeedEventRelevance = "none" | "low" | "medium" | "high";

export interface VoteDetail {
  voter: string;
  votingPower: string;
  proposalId: string;
  proposalTitle: string;
  support: "for" | "against" | "abstain";
}

export interface ProposalDetail {
  proposer: string;
  proposalId: string;
  proposalTitle: string;
  votingPower: string;
}

export interface TransferDetail {
  from: string;
  to: string;
  amount: string;
  fromType: "cex" | "dex" | "lending" | "wallet";
  toType: "cex" | "dex" | "lending" | "wallet";
}

export interface DelegationDetail {
  delegator: string;
  delegate: string;
  previousDelegate: string | null;
  amount: string;
}

export interface FeedEvent {
  txHash: string;
  logIndex: number;
  timestamp: string;
  relevance: FeedEventRelevance;
  type: FeedEventType;
  vote?: VoteDetail;
  proposal?: ProposalDetail;
  transfer?: TransferDetail;
  delegation?: DelegationDetail;
}

export interface FeedEventListResponse {
  items: FeedEvent[];
  totalCount: number;
}

export interface ActivityFeedFilters {
  limit?: number;
  offset?: number;
  sortOrder?: "asc" | "desc";
  fromTimestamp?: number;
  toTimestamp?: number;
  types?: FeedEventType[];
  relevances?: FeedEventRelevance[];
}

export interface ActivityFeedFilterState {
  sortOrder: "desc" | "asc";
  types: FeedEventType[];
  relevances: FeedEventRelevance[];
  fromDate: string;
  toDate: string;
}
