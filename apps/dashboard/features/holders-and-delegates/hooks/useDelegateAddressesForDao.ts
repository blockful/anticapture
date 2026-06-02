"use client";

import { useEffect, useMemo } from "react";

import { getNextPageParam } from "@anticapture/client";
import type { VotingPowersPathParamsDaoEnumKey } from "@anticapture/client";
import { useVotingPowersInfinite } from "@anticapture/client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

const DEFAULT_LIMIT = 50;
const MAX_DELEGATES = 200;

export const useDelegateAddressesForDao = (
  daoId: DaoIdEnum,
  excludeAddress?: string,
  enabled = true,
) => {
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useVotingPowersInfinite(
    daoId.toLowerCase() as VotingPowersPathParamsDaoEnumKey,
    { limit: DEFAULT_LIMIT, orderDirection: "desc" },
    {
      query: {
        enabled,
        getNextPageParam,
      },
    },
  );

  const delegateAddresses = useMemo(() => {
    const addresses =
      data?.pages
        .flatMap((page) => page.items)
        .map((item) => item.accountId.toLowerCase())
        .filter(Boolean) ?? [];

    const unique = [...new Set(addresses)].slice(0, MAX_DELEGATES);

    if (!excludeAddress) {
      return unique;
    }

    const normalizedExclude = excludeAddress.toLowerCase();
    return unique.filter((address) => address !== normalizedExclude);
  }, [data, excludeAddress]);

  useEffect(() => {
    if (!enabled || isLoading || isFetchingNextPage) {
      return;
    }

    if (hasNextPage && delegateAddresses.length < MAX_DELEGATES) {
      void fetchNextPage();
    }
  }, [
    delegateAddresses.length,
    enabled,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  ]);

  return {
    delegateAddresses,
    isLoading:
      isLoading ||
      (enabled && !!hasNextPage && delegateAddresses.length < MAX_DELEGATES),
    error,
  };
};
