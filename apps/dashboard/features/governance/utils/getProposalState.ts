import { ProposalState } from "@/features/governance/types";

export const getProposalState = (status: string): ProposalState => {
  switch (status.toLowerCase()) {
    case "active":
      return ProposalState.ACTIVE;
    case "succeeded":
    case "executed":
    case "defeated":
    case "cancelled":
      return ProposalState.COMPLETED;
    case "pending":
    default:
      return ProposalState.WAITING_TO_START;
  }
};
