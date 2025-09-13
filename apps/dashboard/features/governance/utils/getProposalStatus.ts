import { ProposalStatus } from "@/features/governance/types";

// Map GraphQL status to our enum
export const getProposalStatus = (status: string): ProposalStatus => {
  switch (status.toLowerCase()) {
    case "active":
      return ProposalStatus.ONGOING;
    case "succeeded":
    case "executed":
      return ProposalStatus.EXECUTED;
    case "defeated":
      return ProposalStatus.DEFEATED;
    case "cancelled":
      return ProposalStatus.CANCELLED;
    case "pending":
      return ProposalStatus.PENDING;
    default:
      return ProposalStatus.PENDING;
  }
};
