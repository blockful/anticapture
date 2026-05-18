import {
  getNextPageParam,
  type OrderDirection,
  type VotesByProposalIdPathParamsDaoEnumKey,
  type VotesByProposalIdQueryParams,
  type VotesByProposalIdQueryParamsOrderByEnumKey,
  type VotesByProposalIdQueryResponse,
  type VotingPowerVariation,
  type VotingPowerVariationsPathParamsDaoEnumKey,
} from "@anticapture/client";
import {
  useVotesByProposalIdInfinite,
  votingPowerVariationsQueryOptions,
} from "@anticapture/client/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";
import type { DaoIdEnum } from "@/shared/types/daos";

export type VoteWithHistoricalPower =
  VotesByProposalIdQueryResponse["items"][number] & {
    votingPowerVariation?: VotingPowerVariation;
    isSubRow?: boolean;
  };

export interface UseVotesResult {
  data: VoteWithHistoricalPower[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  fetchNextPage: () => Promise<void>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export interface UseVotesParams {
  daoId?: DaoIdEnum;
  proposalId?: string;
  limit?: number;
  orderBy?: VotesByProposalIdQueryParamsOrderByEnumKey;
  orderDirection?: OrderDirection;
  proposalStartTimestamp?: number;
  support?: string | null;
  voterAddress?: string | null;
}

export const useVotes = ({
  daoId,
  proposalId,
  proposalStartTimestamp,
  limit = 10,
  orderBy = "timestamp",
  orderDirection = "desc",
  support = null,
  voterAddress = null,
}: UseVotesParams = {}): UseVotesResult => {
  const queryClient = useQueryClient();
  const [powerMap, setPowerMap] = useState<
    Record<string, VotingPowerVariation>
  >({});
  const fetchedPageIndexesRef = useRef<Set<number>>(new Set());
  const daoKey = daoId?.toLowerCase() as VotesByProposalIdPathParamsDaoEnumKey;
  const variationsDaoKey =
    daoId?.toLowerCase() as VotingPowerVariationsPathParamsDaoEnumKey;

  const queryParams = useMemo<VotesByProposalIdQueryParams>(
    () => ({
      limit,
      orderBy,
      orderDirection,
      support: support ?? undefined,
      voterAddressIn: voterAddress ? [voterAddress] : undefined,
    }),
    [limit, orderBy, orderDirection, support, voterAddress],
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVotesByProposalIdInfinite(daoKey, proposalId ?? "", queryParams, {
    query: {
      enabled: !!daoId && !!proposalId,
      getNextPageParam,
    },
  });

  useEffect(() => {
    setPowerMap({});
    fetchedPageIndexesRef.current = new Set();
  }, [daoId, proposalId, proposalStartTimestamp, queryParams]);

  const pagesLength = data?.pages.length ?? 0;

  useEffect(() => {
    if (!daoId || !proposalStartTimestamp || !data?.pages.length) return;

    const pageIndex = data.pages.length - 1;
    if (fetchedPageIndexesRef.current.has(pageIndex)) return;

    const newestPage = data.pages[pageIndex];
    const addresses = newestPage.items
      .map((vote) => vote.voterAddress)
      .filter((address) => !powerMap[address.toLowerCase()]);

    if (addresses.length === 0) {
      fetchedPageIndexesRef.current.add(pageIndex);
      return;
    }

    fetchedPageIndexesRef.current.add(pageIndex);
    const toDate = Math.floor(proposalStartTimestamp / 1000);

    void queryClient
      .fetchQuery(
        votingPowerVariationsQueryOptions(variationsDaoKey, {
          addresses,
          fromDate: toDate - DAYS_IN_SECONDS["30d"],
          toDate,
        }),
      )
      .then((result) => {
        setPowerMap((current) => ({
          ...current,
          ...Object.fromEntries(
            result.items.map((item) => [item.accountId.toLowerCase(), item]),
          ),
        }));
      })
      .catch((error) => {
        console.error("Error fetching voting power changes:", error);
      });
  }, [
    daoId,
    data?.pages,
    pagesLength,
    powerMap,
    proposalStartTimestamp,
    queryClient,
    variationsDaoKey,
  ]);

  const votes = useMemo(
    () =>
      (data?.pages.flatMap((page) => page.items) ?? []).map((vote) => ({
        ...vote,
        votingPowerVariation: powerMap[vote.voterAddress.toLowerCase()],
      })),
    [data, powerMap],
  );
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return {
    data: votes,
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
