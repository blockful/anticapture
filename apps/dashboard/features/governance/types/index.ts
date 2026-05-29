import type {
  ProposalQueryResponse,
  ProposalsQueryResponse,
} from "@anticapture/client";

// The proposals endpoints return a `variant`-tagged union (full | lean). The
// dashboard's detail/list views always request the full payload, so narrow to
// the full variant and drop the discriminator to keep these domain types flat.
export type OnchainFullProposalItem = Extract<
  ProposalsQueryResponse["items"][number],
  { variant: "full" }
>;

export const isFullProposal = (
  proposal: ProposalsQueryResponse["items"][number],
): proposal is OnchainFullProposalItem => proposal.variant === "full";

type ClientProposalListItem = Omit<OnchainFullProposalItem, "variant">;

type ClientProposalDetails = Omit<
  Extract<ProposalQueryResponse, { variant: "full" }>,
  "variant"
>;

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

export type ProposalListItem = ClientProposalListItem;
export type ProposalDetails = Omit<
  ClientProposalDetails,
  | "status"
  | "values"
  | "targets"
  | "calldatas"
  | "quorum"
  | "forVotes"
  | "againstVotes"
  | "abstainVotes"
> & {
  status: ProposalStatus;
  quorum: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  values: Array<string | null>;
  targets: Array<string | null>;
  calldatas: Array<string | null>;
};

export type ProposalViewData = Omit<ProposalDetails, "txHash"> & {
  txHash: string | null;
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
  | "targets"
  | "values"
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
  targets: Array<string | null>;
  values: Array<string | null>;
}
