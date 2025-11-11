import { SkeletonRow, Sparkline } from "@/shared/components";
import { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils";
import { useBalanceChartQuery } from "@anticapture/graphql-client/hooks";
import React from "react";
import { useMemo } from "react";

const BalanceChartComponent = ({
  accountId,
  daoId,
  percentageChange,
}: {
  accountId: string;
  daoId: DaoIdEnum;
  percentageChange: number;
}) => {
  const queryOptions = {
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !accountId,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-first" as const,
    nextFetchPolicy: "cache-only" as const,
  };

  const transfersQuery = useBalanceChartQuery({
    variables: {
      accountId,
      limit: 365,
      orderBy: "timestamp",
      orderDirection: "asc",
    },
    ...queryOptions,
    skip: !accountId,
  });

  const chartData =
    useMemo(() => {
      const transfers = transfersQuery.data?.transfers.items || [];
      return (
        transfers.map((item) => ({
          high: item.amount,
        })) || []
      );
    }, [transfersQuery.data?.transfers.items]) || [];

  if (transfersQuery.loading) {
    return (
      <div className="flex w-full justify-center py-2.5">
        <SkeletonRow className="h-5 w-32" />
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center py-2.5">
      <Sparkline
        data={chartData.map((item) => Number(item.high))}
        strokeColor={cn([percentageChange < 0 ? "#f87171" : "#4ADE80"])}
      />
    </div>
  );
};

export const BalanceChart = React.memo(BalanceChartComponent);
