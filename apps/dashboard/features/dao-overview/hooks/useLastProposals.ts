import type { OnchainProposal, ProposalsPathParamsDaoEnumKey } from "@anticapture/client";
import { useProposals } from "@anticapture/client/hooks";
import { useMemo } from "react";
import { formatUnits } from "viem";

import type { Proposal as GovernanceProposal } from "@/features/governance/types";
import {
  getTimeText,
  getProposalStatus,
  getProposalState,
} from "@/features/governance/utils";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export interface UseLastProposalsResult {
  proposals: GovernanceProposal[];
  loading: boolean;
  error: Error | null;
}

const LAST_PROPOSALS_LIMIT = 3;

const transformProposal = (
  proposal: OnchainProposal,
  decimals: number,
): GovernanceProposal => {
  const forVotes = Number(formatUnits(BigInt(proposal.forVotes || "0"), decimals));
  const againstVotes = Number(formatUnits(BigInt(proposal.againstVotes || "0"), decimals));
  const abstainVotes = Number(formatUnits(BigInt(proposal.abstainVotes || "0"), decimals));
  const quorum = Number(formatUnits(BigInt(proposal.quorum || "0"), decimals));
  const total = forVotes + againstVotes + abstainVotes;
  const forPercentage = total > 0 ? (forVotes / total) * 100 : 0;
  const againstPercentage = total > 0 ? (againstVotes / total) * 100 : 0;
  const timeText = getTimeText(
    proposal.startTimestamp.toString(),
    proposal.endTimestamp.toString(),
  );

  return {
    ...proposal,
    title: proposal.title || "Untitled Proposal",
    status: getProposalStatus(proposal.status),
    state: getProposalState(proposal.status),
    proposer: proposal.proposerAccountId,
    votes: {
      for: forVotes.toFixed(2),
      against: againstVotes.toFixed(2),
      total: total.toFixed(2),
      forPercentage: forPercentage.toFixed(0),
      againstPercentage: againstPercentage.toFixed(0),
    },
    quorum: quorum.toFixed(2),
    timeText,
    values: proposal.values,
    targets: proposal.targets,
  } as unknown as GovernanceProposal;
};

export const useLastProposals = (daoId: DaoIdEnum): UseLastProposalsResult => {
  const { decimals } = daoConfig[daoId];

  const { data, isLoading, error } = useProposals(
    daoId.toLowerCase() as ProposalsPathParamsDaoEnumKey,
    {
      skip: 0,
      limit: LAST_PROPOSALS_LIMIT,
      orderDirection: "desc",
    },
  );

  const proposals = useMemo(() => {
    return (data?.items ?? []).map((proposal) =>
      transformProposal(proposal, decimals),
    );
  }, [data, decimals]);

  return {
    proposals,
    loading: isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
  };
};
