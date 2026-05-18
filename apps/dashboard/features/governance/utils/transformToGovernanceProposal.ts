import type { OnchainProposal } from "@anticapture/client";
import { formatUnits } from "viem";

import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import {
  getTimeText,
  getProposalStatus,
  getProposalState,
} from "@/features/governance/utils";

const toBigInt = (value: string | number | bigint | null | undefined) =>
  BigInt(value ?? 0);

const toStringArray = (values: readonly (string | bigint | null)[]) =>
  values.map((value) => (value === null ? null : value.toString()));

// Helper function to transform API proposal data to governance component format
export const transformToGovernanceProposal = (
  graphqlProposal: OnchainProposal,
  decimals: number,
): GovernanceProposal => {
  const forVotes = Number(
    formatUnits(toBigInt(graphqlProposal?.forVotes), decimals),
  );
  const againstVotes = Number(
    formatUnits(toBigInt(graphqlProposal?.againstVotes), decimals),
  );
  const abstainVotes = Number(
    formatUnits(toBigInt(graphqlProposal?.abstainVotes), decimals),
  );
  const quorum = Number(
    formatUnits(toBigInt(graphqlProposal?.quorum), decimals),
  );
  const total = forVotes + againstVotes + abstainVotes;

  const forPercentage = total > 0 ? (forVotes / total) * 100 : 0;
  const againstPercentage = total > 0 ? (againstVotes / total) * 100 : 0;

  // Calculate time text using the helper function
  const timeText = getTimeText(
    graphqlProposal.startTimestamp.toString(),
    graphqlProposal.endTimestamp.toString(),
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
    values: toStringArray(graphqlProposal.values),
    targets: toStringArray(graphqlProposal.targets),
  };
};
