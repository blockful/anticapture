import { ActivityIndicator } from "@/shared/components";
import {
  Query_ProposalsActivity_Proposals_Items_Proposal,
  Query_ProposalsActivity_Proposals_Items_UserVote,
} from "@anticapture/graphql-client";
import {
  XCircle,
  CheckCircle,
  CircleMinus,
  ThumbsDown,
  Clock10,
  UserX,
} from "lucide-react";
import React, { ReactNode } from "react";

// Vote mapping object
export const proposalsUserVoteMapping = {
  0: {
    support: "0",
    text: "No",
    icon: <XCircle className="text-error size-4" />,
  },
  1: {
    support: "1",
    text: "Yes",
    icon: <CheckCircle className="text-success size-4" />,
  },
  2: {
    support: "2",
    text: "Abstain",
    icon: <CircleMinus className="text-secondary size-4" />,
  },
  "didnt-vote": {
    support: null,
    text: "Didn't vote",
    icon: <ThumbsDown className="text-secondary size-4" />,
  },
  waiting: {
    support: null,
    text: "Waiting",
    icon: <Clock10 className="text-secondary size-4" />,
  },
};

// Final result mapping object
export const proposalsFinalResultMapping = {
  ongoing: {
    text: "Ongoing",
    icon: <ActivityIndicator className="text-warning" />,
  },
  yes: {
    text: "Yes",
    icon: <CheckCircle className="text-success size-4" />,
  },
  no: {
    text: "No",
    icon: <XCircle className="text-error size-4" />,
  },
  cancel: {
    text: "Cancel",
    icon: <CircleMinus className="text-secondary size-4" />,
  },
  "no-quorum": {
    text: "No quorum",
    icon: <UserX className="text-secondary size-4" />,
  },
  unknown: {
    text: "Unknown",
    icon: <ThumbsDown className="text-secondary size-4" />,
  },
};

// Helper function to extract proposal name from description
export const extractProposalName = (description: string): string => {
  if (!description) return "Untitled Proposal";

  // Split by line breaks and get the first line
  const firstLine = description.split("\n")[0];

  // Remove markdown formatting (like # for headers)
  const cleanedTitle = firstLine.replace(/^#+\s*/, "").trim();

  return cleanedTitle || "Untitled Proposal";
};

// Helper function to get user vote data for TextIconLeft
export const getUserVoteData = (
  support: string | null | undefined,
  finalResultStatus: string | undefined,
): { text: string; icon: ReactNode } => {
  // If user voted
  if (support !== null && support !== undefined) {
    const supportNumber = Number(support);
    const voteData = proposalsUserVoteMapping[supportNumber as keyof typeof proposalsUserVoteMapping];
    if (voteData) {
      return { text: voteData.text, icon: voteData.icon };
    }
  }

  // If user didn't vote, check final result status
  const status = finalResultStatus?.toLowerCase();
  if (status === "ongoing") {
    return { text: proposalsUserVoteMapping.waiting.text, icon: proposalsUserVoteMapping.waiting.icon };
  }

  return {
    text: proposalsUserVoteMapping["didnt-vote"].text,
    icon: proposalsUserVoteMapping["didnt-vote"].icon,
  };
};

// Status to result mapping
const statusToResultMapping: Record<string, keyof typeof proposalsFinalResultMapping> = {
  active: "ongoing",
  executed: "yes",
  succeeded: "yes",
  failed: "no",
  canceled: "cancel",
  "no-quorum": "no-quorum",
  noquorum: "no-quorum",
};

// Helper function to determine the actual status of a proposal
const determineProposalStatus = (
  proposal: Query_ProposalsActivity_Proposals_Items_Proposal | undefined,
  daoVotingPeriod: number | undefined,
  daoQuorum: number | undefined,
): keyof typeof proposalsFinalResultMapping => {
  if (!proposal) return "unknown";

  const status = proposal.status?.toLowerCase();

  // For pending proposals, check if voting period has ended
  if (status === "pending") {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const proposalStartTime = Number(proposal.timestamp);

    // Use DAO's voting period if available, otherwise fallback to 30 days
    const votingDuration = Number(daoVotingPeriod); // DAO voting period or 30 days in seconds
    const votingEndTime = proposalStartTime + votingDuration;

    // If voting period has ended, check if it met quorum
    if (currentTime > votingEndTime) {
      if (daoQuorum) {
        const totalVotes =
          Number(proposal.forVotes) +
          Number(proposal.againstVotes) +
          Number(proposal.abstainVotes);
        const quorumThreshold = Number(daoQuorum);

        // If total votes didn't reach quorum, it's no-quorum
        if (totalVotes < quorumThreshold) {
          return "no-quorum";
        }
      }
      return "cancel";
    }

    // Otherwise, it's still ongoing
    return "ongoing";
  }

  // For defeated/failed proposals, check if they met quorum
  if (status === "defeated" || status === "failed") {
    if (daoQuorum) {
      const totalVotes =
        Number(proposal.forVotes) +
        Number(proposal.againstVotes) +
        Number(proposal.abstainVotes);
      const quorumThreshold = Number(daoQuorum);

      // If total votes didn't reach quorum, it's no-quorum
      if (totalVotes < quorumThreshold) {
        return "no-quorum";
      }
    }
    // If quorum was met, it's a regular "no" result
    return "no";
  }

  // For all other statuses, use the existing mapping
  return statusToResultMapping[status] || "unknown";
};

// Helper function to get final result data for TextIconLeft
export const getFinalResultData = (
  proposal: Query_ProposalsActivity_Proposals_Items_Proposal | undefined,
  daoVotingPeriod: number | undefined,
  daoQuorum: number | undefined,
): { text: string; icon: ReactNode } => {
  if (!proposal) return proposalsFinalResultMapping.unknown;

  const resultKey = determineProposalStatus(
    proposal,
    daoVotingPeriod,
    daoQuorum,
  );
  return proposalsFinalResultMapping[resultKey];
};

// Helper function to check if proposal is finished
export const isProposalFinished = (
  finalResultStatus: string | undefined,
): boolean => {
  const status = finalResultStatus?.toLowerCase();
  return status !== "ongoing";
};

// Helper function to format vote timing and calculate percentage
export const getVoteTimingData = (
  userVote: Query_ProposalsActivity_Proposals_Items_UserVote | null | undefined,
  proposal: Query_ProposalsActivity_Proposals_Items_Proposal,
  finalResultStatus: string | undefined,
  daoVotingPeriod: number | undefined,
): { text: string; percentage: number } => {
  // If user didn't vote
  if (!userVote || !userVote.timestamp) {
    // Check if proposal is finished using final result status
    if (isProposalFinished(finalResultStatus)) {
      return { text: "-", percentage: 0 };
    }
    return { text: "Waiting", percentage: 0 };
  }

  // Convert timestamps to numbers for calculation
  const voteTime = Number(userVote.timestamp);
  const startTime = Number(proposal.timestamp); // Proposal start time
  const duration = Number(daoVotingPeriod ?? 0); // Use DAO voting period or fallback to 30 days
  const endTime = startTime + duration;

  if (voteTime >= endTime) {
    return { text: "Expired", percentage: 100 };
  }

  // Calculate how much time has passed as a percentage
  const timeElapsed = voteTime - startTime;
  const percentage = Math.max(0, Math.min(100, (timeElapsed / duration) * 100));

  const timeDiff = endTime - voteTime;
  const daysLeft = Math.floor(timeDiff / (24 * 60 * 60));

  if (daysLeft >= 4) {
    return { text: `Early (${daysLeft}d left)`, percentage };
  } else {
    return { text: `Late (${daysLeft}d left)`, percentage };
  }
};
