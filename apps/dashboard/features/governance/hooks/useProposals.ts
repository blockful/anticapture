import {
  getNextPageParam,
  orderDirectionEnum,
  type ProposalsPathParamsDaoEnumKey,
  type ProposalsQueryParams,
} from "@anticapture/client";
import { useProposalsInfinite } from "@anticapture/client/hooks";
import { useMemo } from "react";
import { formatUnits } from "viem";

import {
  isFullProposal,
  type Proposal as GovernanceProposal,
} from "@/features/governance/types";
import {
  getProposalState,
  getProposalStatus,
  getTimeText,
} from "@/features/governance/utils";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export interface UseProposalsParams extends Omit<ProposalsQueryParams, "skip"> {
  daoId?: DaoIdEnum;
}

export const useProposals = (
  {
    fromDate,
    orderDirection = orderDirectionEnum.desc,
    status,
    fromEndDate,
    includeOptimisticProposals,
    limit = 10,
    daoId,
  }: UseProposalsParams = {
    fromDate: undefined,
    status: undefined,
    fromEndDate: undefined,
    includeOptimisticProposals: undefined,
  },
) => {
  const { decimals } = daoConfig[daoId as DaoIdEnum];
  const daoKey = daoId?.toLowerCase() as ProposalsPathParamsDaoEnumKey;

  const queryParams = useMemo<ProposalsQueryParams>(
    () => ({
      limit,
      orderDirection,
      status,
      fromDate,
      fromEndDate,
      includeOptimisticProposals,
    }),
    [
      limit,
      orderDirection,
      status,
      fromDate,
      fromEndDate,
      includeOptimisticProposals,
    ],
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useProposalsInfinite(daoKey, queryParams, {
    query: {
      enabled: !!daoId,
      getNextPageParam,
    },
  });

  const proposals = useMemo(() => {
    const rawProposals = (
      data?.pages.flatMap((page) => page.items) ?? []
    ).filter(isFullProposal);

    return rawProposals.map((proposal) => {
      const forVotes = Number(formatUnits(proposal.forVotes, decimals));
      const againstVotes = Number(formatUnits(proposal.againstVotes, decimals));
      const abstainVotes = Number(formatUnits(proposal.abstainVotes, decimals));
      const quorum = Number(formatUnits(proposal.quorum, decimals));
      const total = forVotes + againstVotes + abstainVotes;
      const forPercentage = total > 0 ? (forVotes / total) * 100 : 0;
      const againstPercentage = total > 0 ? (againstVotes / total) * 100 : 0;
      const abstainPercentage = total > 0 ? (abstainVotes / total) * 100 : 0;

      return {
        ...proposal,
        title: proposal.title,
        status: getProposalStatus(proposal.status),
        state: getProposalState(proposal.status),
        proposer: proposal.proposerAccountId,
        votes: {
          for: forVotes.toFixed(2),
          against: againstVotes.toFixed(2),
          abstain: abstainVotes.toFixed(2),
          total: total.toFixed(2),
          // Keep precision for bar widths; consumers round for display
          forPercentage: forPercentage.toFixed(2),
          againstPercentage: againstPercentage.toFixed(2),
          abstainPercentage: abstainPercentage.toFixed(2),
        },
        quorum: quorum.toFixed(2),
        timeText: getTimeText(proposal.startTimestamp, proposal.endTimestamp),
        values: proposal.values.map((value) => value.toString()),
        targets: proposal.targets,
      } satisfies GovernanceProposal;
    });
  }, [data, decimals]);

  return {
    data: proposals,
    isLoading,
    error,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  };
};
