import type { Query_Proposals_Items_Items } from "@anticapture/graphql-client/hooks";

export enum ProposalStatus {
  PENDING = "pending",
  ONGOING = "ongoing",
  EXECUTED = "executed",
  DEFEATED = "defeated",
  CANCELLED = "cancelled",
  QUEUED = "queued",
  SUCCEEDED = "succeeded",
  EXPIRED = "expired",
  NO_QUORUM = "no_quorum",
}

export enum ProposalState {
  WAITING_TO_START = "waiting_to_start",
  ACTIVE = "active",
  COMPLETED = "completed",
}

export interface ProposalVotes {
  for: number;
  against: number;
  total: number;
  forPercentage: number;
  againstPercentage: number;
}

// Use the generated GraphQL type as base and extend with computed properties
export interface Proposal
  extends Omit<
    Query_Proposals_Items_Items,
    | "endBlock"
    | "startBlock"
    | "forVotes"
    | "againstVotes"
    | "abstainVotes"
    | "quorum"
  > {
  title: string; // Add title field that's computed from description
  status: ProposalStatus;
  state: ProposalState;
  proposer: string; // Alias for proposerAccountId
  votes: ProposalVotes;
  quorum: number; // Convert from string to number
  timeText?: string;
  timeRemaining?: string;
  timeAgo?: string;
  hasCheckmark?: boolean;
}

export interface GovernanceData {
  proposals: Proposal[];
  totalProposals: number;
}
