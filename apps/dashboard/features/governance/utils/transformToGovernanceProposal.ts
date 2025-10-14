import { Query_Proposals_Items_Items } from "@anticapture/graphql-client/hooks";
import {
  getTimeText,
  getProposalStatus,
  formatVotes,
  getProposalState,
} from "@/features/governance/utils";
import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import { formatEther } from "viem";

type GraphQLProposal = Omit<
  Query_Proposals_Items_Items,
  "endBlock" | "startBlock"
>;

// Helper function to transform GraphQL proposal data to governance component format
export const transformToGovernanceProposal = (
  graphqlProposal: GraphQLProposal,
): GovernanceProposal => {
  const forVotes = parseInt(graphqlProposal?.forVotes || "0");
  const againstVotes = parseInt(graphqlProposal?.againstVotes || "0");
  const abstainVotes = parseInt(graphqlProposal?.abstainVotes || "0");
  const quorum = formatEther(BigInt(graphqlProposal?.quorum || "0"));

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
    // Spread all the original GraphQL fields
    ...graphqlProposal,
    // Add computed fields
    title: graphqlProposal.title || "Untitled Proposal",
    status: getProposalStatus(graphqlProposal.status),
    state: getProposalState(graphqlProposal.status),
    proposer: graphqlProposal.proposerAccountId,
    votes: {
      for: forVotes.toString(),
      against: againstVotes.toString(),
      total: formatVotes(total),
      forPercentage: forPercentage.toString(),
      againstPercentage: againstPercentage.toString(),
    },
    quorum: quorum,
    timeText,
    values: graphqlProposal.values,
    calldatas: graphqlProposal.calldatas,
    targets: graphqlProposal.targets,
  };
};
