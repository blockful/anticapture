import { Query_Proposals_Items } from "@anticapture/graphql-client/hooks";
import {
  getTimeText,
  getProposalStatus,
  formatVotes,
  getProposalState,
} from "@/features/governance/utils";
import type { Proposal as GovernanceProposal } from "@/features/governance/types";

type Proposal = Omit<Query_Proposals_Items, "endBlock" | "startBlock">;

// Helper function to transform GraphQL proposal data to governance component format
export const transformToGovernanceProposal = (
  graphqlProposal: Proposal,
): GovernanceProposal => {
  const forVotes = parseInt(graphqlProposal.forVotes);
  const againstVotes = parseInt(graphqlProposal.againstVotes);
  const abstainVotes = parseInt(graphqlProposal.abstainVotes);
  const quorum = parseInt(graphqlProposal.quorum);

  const total = forVotes + againstVotes + abstainVotes;

  const forPercentage = total > 0 ? Math.round((forVotes / total) * 100) : 0;
  const againstPercentage =
    total > 0 ? Math.round((againstVotes / total) * 100) : 0;

  // Calculate time text using the helper function
  const timeText = getTimeText(
    graphqlProposal.startTimestamp,
    graphqlProposal.endTimestamp,
  );

  return {
    id: graphqlProposal.id,
    title: graphqlProposal.title || "Untitled Proposal",
    status: getProposalStatus(graphqlProposal.status),
    state: getProposalState(graphqlProposal.status),
    description: graphqlProposal.description,
    proposer: graphqlProposal.proposerAccountId,
    votes: {
      for: forVotes,
      against: againstVotes,
      total: formatVotes(total),
      forPercentage,
      againstPercentage,
    },
    quorum: formatVotes(quorum),
    timeText,
  };
};
