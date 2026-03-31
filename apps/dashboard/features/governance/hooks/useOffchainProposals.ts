import type {
  GetOffchainProposalsFromDaoQuery,
  QueryOffchainProposalsArgs,
} from "@anticapture/graphql-client/hooks";
import {
  OrderDirection,
  useGetOffchainProposalsFromDaoQuery,
} from "@anticapture/graphql-client/hooks";
import type { ApolloError } from "@apollo/client";
import { useCallback, useMemo, useState } from "react";

import type { PaginationInfo } from "@/features/governance/hooks/useProposals";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

export type OffchainProposalItem = NonNullable<
  NonNullable<
    GetOffchainProposalsFromDaoQuery["offchainProposals"]
  >["items"][number]
>;

export interface UseOffchainProposalsResult {
  proposals: OffchainProposalItem[];
  loading: boolean;
  error: ApolloError | undefined;
  pagination: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  isPaginationLoading: boolean;
}

export interface UseOffchainProposalsParams extends Partial<
  Omit<QueryOffchainProposalsArgs, "skip" | "limit">
> {
  itemsPerPage?: number;
  daoId?: DaoIdEnum;
}

export const useOffchainProposals = ({
  fromDate,
  orderDirection = OrderDirection.Desc,
  status,
  itemsPerPage = 10,
  daoId,
}: UseOffchainProposalsParams = {}): UseOffchainProposalsResult => {
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  const queryVariables = useMemo(
    () => ({
      skip: 0,
      limit: itemsPerPage,
      orderDirection,
      status: status ?? null,
      fromDate: fromDate ?? null,
    }),
    [itemsPerPage, orderDirection, status, fromDate],
  );

  const { data, loading, error, fetchMore } =
    useGetOffchainProposalsFromDaoQuery({
      variables: queryVariables,
      skip: !daoId,
      notifyOnNetworkStatusChange: true,
      context: {
        headers: {
          "anticapture-dao-id": daoId,
          ...getAuthHeaders(),
        },
      },
    });

  const proposals = useMemo(() => {
    return (data?.offchainProposals?.items ?? []).filter(
      (p): p is OffchainProposalItem => p !== null,
    );
  }, [data]);

  const pagination: PaginationInfo = useMemo(() => {
    const totalCount = data?.offchainProposals?.totalCount ?? 0;
    const currentItemsCount = proposals.length;
    const hasNextPage = currentItemsCount < totalCount;
    const currentPage = Math.ceil(currentItemsCount / itemsPerPage);
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      hasNextPage,
      totalCount,
      currentPage,
      totalPages,
      itemsPerPage,
      currentItemsCount,
    };
  }, [data?.offchainProposals?.totalCount, proposals.length, itemsPerPage]);

  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || isPaginationLoading) return;

    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: { ...queryVariables, skip: proposals.length },
        updateQuery: (
          previousResult: GetOffchainProposalsFromDaoQuery,
          {
            fetchMoreResult,
          }: { fetchMoreResult: GetOffchainProposalsFromDaoQuery },
        ) => {
          if (!fetchMoreResult?.offchainProposals?.items?.length) {
            return previousResult;
          }

          return {
            ...fetchMoreResult,
            offchainProposals: {
              ...fetchMoreResult.offchainProposals,
              items: [
                ...(previousResult.offchainProposals?.items ?? []),
                ...(fetchMoreResult.offchainProposals?.items ?? []),
              ],
            },
          };
        },
      });
    } catch (err) {
      console.error("Error fetching next page:", err);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    pagination.hasNextPage,
    isPaginationLoading,
    queryVariables,
    proposals.length,
  ]);

  return {
    proposals,
    loading,
    error,
    pagination,
    fetchNextPage,
    isPaginationLoading,
  };
};
