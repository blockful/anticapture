import { useMemo } from "react";

import {
  getNextPageParam,
  type OffchainVote,
  type VotesOffchainByProposalIdPathParams,
  type VotesOffchainByProposalIdQueryParams,
} from "@anticapture/client";
import { useVotesOffchainByProposalIdInfinite } from "@anticapture/client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

export interface UseOffchainVotesParams extends VotesOffchainByProposalIdQueryParams {
  daoId?: DaoIdEnum;
  proposalId?: string;
}

export const useOffchainVotes = ({
  daoId,
  proposalId,
  limit = 10,
  orderBy,
  orderDirection,
  voterAddresses,
  fromDate,
  toDate,
}: UseOffchainVotesParams) => {
  const params = useMemo<VotesOffchainByProposalIdQueryParams>(
    () => ({
      limit,
      orderBy,
      orderDirection,
      voterAddresses,
      fromDate,
      toDate,
    }),
    [fromDate, limit, orderBy, orderDirection, toDate, voterAddresses],
  );

  const query = useVotesOffchainByProposalIdInfinite(
    daoId?.toLowerCase() as VotesOffchainByProposalIdPathParams["dao"],
    proposalId ?? "",
    params,
    {
      query: {
        getNextPageParam,
        enabled: !!daoId && !!proposalId,
      },
    },
  );

  const data = useMemo<OffchainVote[]>(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  return {
    data,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    error: query.error,
  };
};
