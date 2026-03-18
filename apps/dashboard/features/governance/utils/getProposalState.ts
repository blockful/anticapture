import { ProposalState } from "@/features/governance/types";

export const getProposalState = (status: string): ProposalState => {
  if (!status) return ProposalState.WAITING_TO_START;

  switch (status.toLowerCase()) {
    case "active":
      return ProposalState.ACTIVE;
    case "succeeded":
    case "executed":
    case "defeated":
    case "pending_execution":
    case "cancelled":
    case "queued":
    case "no_quorum":
    case "expired":
      return ProposalState.COMPLETED;
    case "pending":
    default:
      return ProposalState.WAITING_TO_START;
  }
};
