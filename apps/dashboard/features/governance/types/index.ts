export enum ProposalStatus {
  PENDING = "pending",
  ONGOING = "ongoing",
  EXECUTED = "executed",
  DEFEATED = "defeated",
  CANCELLED = "cancelled",
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
  timeRemaining?: string;
  timeAgo?: string;
  hasCheckmark?: boolean;
}

export interface GovernanceData {
  proposals: Proposal[];
  totalProposals: number;
}
