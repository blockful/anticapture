import { ProposalStatus } from "@/features/governance/types";

// Map GraphQL status to our enum
export const getProposalStatus = (status: string): ProposalStatus => {
  if (!status) return ProposalStatus.PENDING;

  switch (status?.toLowerCase()) {
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
    case "no_quorum":
      return ProposalStatus.NO_QUORUM;
    case "queued":
      return ProposalStatus.QUEUED;
    case "expired":
      return ProposalStatus.EXPIRED;
    default:
      return ProposalStatus.PENDING;
  }
};
