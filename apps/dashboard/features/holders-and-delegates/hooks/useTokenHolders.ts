import type { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";
import { PERCENTAGE_NO_BASELINE } from "@/shared/constants/api";
import { useAccountBalancesInfinite } from "@anticapture/client/hooks";
import type {
  AccountBalancesPathParamsDaoEnumKey,
  AccountBalancesQueryParams,
} from "@anticapture/client";
import type { Address } from "viem";
import { formatUnits } from "viem";
import type { TimeInterval } from "@/shared/types/enums";
import { useMemo } from "react";

export type TokenHolder = {
  address: Address;
  delegate: Address;
  balance: number;
  tokenId: string;
  variation: {
    absoluteChange: number;
    previousBalance: number;
    currentBalance: number;
    percentageChange: number;
    accountId: Address;
  };
};

export const useTokenHolders = (
  daoId: DaoIdEnum,
  params: AccountBalancesQueryParams & {
    fromDay?: TimeInterval;
    toDay?: TimeInterval;
  },
) => {
  const {
    fromDay,
    toDay,
    fromDate: fromDateParam,
    toDate: toDateParam,
    limit,
    skip,
    orderDirection,
    orderBy,
    excludeDaoAddresses,
    addresses,
    delegates,
    fromValue,
    toValue,
  } = params;
  const { decimals } = daoConfigByDaoId[daoId];
  const addressesKey = addresses?.join(",") ?? "";
  const delegatesKey = delegates?.join(",") ?? "";

  const queryParams = useMemo<AccountBalancesQueryParams>(() => {
    const now = Math.floor(Date.now() / 1000);

    return {
      fromDate: fromDay ? now - DAYS_IN_SECONDS[fromDay] : fromDateParam,
      toDate: toDay ? now - DAYS_IN_SECONDS[toDay] : toDateParam,
      limit,
      skip,
      orderDirection,
      orderBy,
      excludeDaoAddresses,
      addresses: addressesKey ? addressesKey.split(",") : undefined,
      delegates: delegatesKey ? delegatesKey.split(",") : undefined,
      fromValue,
      toValue,
    };
  }, [
    fromDay,
    toDay,
    fromDateParam,
    toDateParam,
    limit,
    skip,
    orderDirection,
    orderBy,
    excludeDaoAddresses,
    addressesKey,
    delegatesKey,
    fromValue,
    toValue,
  ]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    hasPreviousPage,
    refetch,
    isFetchingNextPage,
  } = useAccountBalancesInfinite(
    // this works because this endpoint is supported for all DAOs
    daoId.toLowerCase() as AccountBalancesPathParamsDaoEnumKey,
    queryParams,
  );

  const normalizedError =
    !isLoading && error
      ? error instanceof Error
        ? error
        : new Error("Unable to load token holders")
      : null;

  return {
    data: data?.pages.flatMap((page) =>
      page.items.map((item) => ({
        ...item,
        address: item.address as unknown as Address,
        delegate: item.delegate as unknown as Address,
        balance: Number(formatUnits(BigInt(item.balance), decimals)),
        variation: {
          accountId: item.variation.accountId as unknown as Address,
          absoluteChange: Number(
            formatUnits(BigInt(item.variation.absoluteChange), decimals),
          ),
          previousBalance: Number(
            formatUnits(BigInt(item.variation.previousBalance), decimals),
          ),
          currentBalance: Number(
            formatUnits(BigInt(item.variation.currentBalance), decimals),
          ),
          percentageChange:
            item.variation.percentageChange === PERCENTAGE_NO_BASELINE
              ? 9999
              : Number(item.variation.percentageChange),
        },
      })),
    ),
    isLoading,
    isFetchingNextPage,
    error: normalizedError,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    refetch,
  };
};
