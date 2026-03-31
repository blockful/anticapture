import type {
  GetProposalQuery,
  GetProposalsFromDaoQuery,
} from "@anticapture/graphql-client/hooks";

type GraphqlProposalListItem = NonNullable<
  NonNullable<
    NonNullable<GetProposalsFromDaoQuery["proposals"]>["items"]
  >[number]
>;

type GraphqlProposalDetails = Extract<
  NonNullable<GetProposalQuery["proposal"]>,
  { __typename?: "OnchainProposal" }
>;

export interface ProposalViewData {
  id: string;
  daoId: string;
  txHash: string | null;
  proposerAccountId: string;
  title: string;
  description: string;
  quorum: string;
  timestamp: number;
  status: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  startTimestamp: number;
  endTimestamp: number;
  calldatas: Array<string | null> | null;
  targets: Array<string | null>;
  values: Array<string | null>;
}

export enum ProposalStatus {
  PENDING = "pending",
  ONGOING = "ongoing",
  EXECUTED = "executed",
  DEFEATED = "defeated",
  CANCELED = "canceled",
  QUEUED = "queued",
  PENDING_EXECUTION = "pending_execution",
  SUCCEEDED = "succeeded",
  EXPIRED = "expired",
  NO_QUORUM = "no_quorum",
  CLOSED = "closed",
}

export enum ProposalState {
  WAITING_TO_START = "waiting_to_start",
  ACTIVE = "active",
  COMPLETED = "completed",
}

export interface Votes {
  for: string;
  against: string;
  total: string;
  forPercentage: string;
  againstPercentage: string;
}

// Use the generated GraphQL type as base and extend with computed properties
export type ProposalListItem = GraphqlProposalListItem;
export type ProposalDetails = Omit<GraphqlProposalDetails, "status"> & {
  status: ProposalStatus;
};

export interface Proposal extends Omit<
  ProposalListItem,
  | "endBlock"
  | "startBlock"
  | "forVotes"
  | "againstVotes"
  | "abstainVotes"
  | "quorum"
  | "description"
  | "calldatas"
> {
  title: string; // Add title field that's computed from description
  status: ProposalStatus;
  state: ProposalState;
  proposer: string; // Alias for proposerAccountId
  votes: Votes;
  quorum: string;
  timeText?: string;
  timeRemaining?: string;
  timeAgo?: string;
  hasCheckmark?: boolean;
}

export interface GovernanceData {
  proposals: Proposal[];
  totalProposals: number;
}
