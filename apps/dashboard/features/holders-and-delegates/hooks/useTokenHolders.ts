import type { DaoIdEnum } from "@/shared/types/daos";
import { useAccountBalancesInfinite } from "@anticapture/client/hooks";
import type {
  AccountBalancesPathParamsDaoEnumKey,
  AccountBalancesQueryParams,
} from "@anticapture/client";
import type { Address } from "viem";
import { PERCENTAGE_NO_BASELINE } from "@/shared/constants/api";
import { formatUnits } from "viem";
import type { TimeInterval } from "@/shared/types/enums";

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
    params,
  );

  return {
    data: data?.pages.flatMap((page) =>
      page.items.map((item) => ({
        ...item,
        address: item.address as unknown as Address,
        delegate: item.delegate as unknown as Address,
        balance: Number(formatUnits(BigInt(item.balance), 18)),
        variation: {
          accountId: item.variation.accountId as unknown as Address,
          absoluteChange: Number(
            formatUnits(BigInt(item.variation.absoluteChange), 18),
          ),
          previousBalance: Number(
            formatUnits(BigInt(item.variation.previousBalance), 18),
          ),
          currentBalance: Number(
            formatUnits(BigInt(item.variation.currentBalance), 18),
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
    error: !isLoading && Boolean(error),
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    refetch,
  };
};
