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

export interface Proposal {
  id: string;
  title: string;
  status: ProposalStatus;
  state: ProposalState;
  description?: string;
  proposer: string;
  votes: ProposalVotes;
  quorum: number;
  timeText?: string;
  timeRemaining?: string;
  timeAgo?: string;
  hasCheckmark?: boolean;
}

export interface GovernanceData {
  proposals: Proposal[];
  totalProposals: number;
}
