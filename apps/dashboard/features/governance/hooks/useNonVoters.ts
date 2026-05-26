import {
  getNextPageParam,
  orderDirectionEnum,
  type OrderDirection,
  type ProposalNonVotersPathParamsDaoEnumKey,
  type ProposalNonVotersQueryParams,
  type ProposalNonVotersQueryResponse,
} from "@anticapture/client";
import { useProposalNonVotersInfinite } from "@anticapture/client/hooks";
import { useMemo } from "react";

import type { DaoIdEnum } from "@/shared/types/daos";

export type NonVoter = ProposalNonVotersQueryResponse["items"][number] & {
  isSubRow?: boolean;
};

export interface UseNonVotersResult {
  data: NonVoter[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  fetchNextPage: () => Promise<void>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export interface UseNonVotersParams {
  daoId?: DaoIdEnum;
  proposalId?: string;
  limit?: number;
  orderDirection?: OrderDirection;
}

export const useNonVoters = ({
  daoId,
  proposalId,
  limit = 10,
  orderDirection = orderDirectionEnum.desc,
}: UseNonVotersParams = {}): UseNonVotersResult => {
  const daoKey = daoId?.toLowerCase() as ProposalNonVotersPathParamsDaoEnumKey;
  const queryParams = useMemo<ProposalNonVotersQueryParams>(
    () => ({
      limit,
      orderDirection,
    }),
    [limit, orderDirection],
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProposalNonVotersInfinite(daoKey, proposalId ?? "", queryParams, {
    query: {
      enabled: !!daoId && !!proposalId,
      getNextPageParam,
    },
  });

  const nonVoters = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return {
    data: nonVoters,
    totalCount,
    isLoading,
    error: error instanceof Error ? error : null,
    fetchNextPage: async () => {
      await fetchNextPage();
    },
    hasNextPage,
    isFetchingNextPage,
  };
};
