import { GetProposalsFromDaoQuery } from "@anticapture/graphql-client/hooks";
import {
  getTimeText,
  getProposalStatus,
  getProposalState,
} from "@/features/governance/utils";
import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import { formatUnits } from "viem";

type GraphQLProposal = NonNullable<
  NonNullable<
    NonNullable<GetProposalsFromDaoQuery["proposals"]>["items"]
  >[number]
>;

// Helper function to transform GraphQL proposal data to governance component format
export const transformToGovernanceProposal = (
  graphqlProposal: GraphQLProposal,
  decimals: number,
): GovernanceProposal => {
  const forVotes = Number(
    formatUnits(BigInt(graphqlProposal?.forVotes || "0"), decimals),
  );
  const againstVotes = Number(
    formatUnits(BigInt(graphqlProposal?.againstVotes || "0"), decimals),
  );
  const abstainVotes = Number(
    formatUnits(BigInt(graphqlProposal?.abstainVotes || "0"), decimals),
  );
  const quorum = Number(
    formatUnits(BigInt(graphqlProposal?.quorum || "0"), decimals),
  );
  const total = forVotes + againstVotes + abstainVotes;

  const forPercentage = total > 0 ? (forVotes / total) * 100 : 0;
  const againstPercentage = total > 0 ? (againstVotes / total) * 100 : 0;

  // Calculate time text using the helper function
  const timeText = getTimeText(
    graphqlProposal.startTimestamp,
    graphqlProposal.endTimestamp,
  );

  return {
    ...graphqlProposal,
    title: graphqlProposal.title || "Untitled Proposal",
    status: getProposalStatus(graphqlProposal.status),
    state: getProposalState(graphqlProposal.status),
    proposer: graphqlProposal.proposerAccountId,
    votes: {
      for: forVotes.toFixed(2),
      against: againstVotes.toFixed(2),
      total: total.toFixed(2),
      forPercentage: forPercentage.toFixed(0),
      againstPercentage: againstPercentage.toFixed(0),
    },
    quorum: quorum.toFixed(2),
    timeText,
    values: graphqlProposal.values,
    calldatas: graphqlProposal.calldatas,
    targets: graphqlProposal.targets,
  };
};
