import { SkeletonRow, Sparkline } from "@/shared/components";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { cn } from "@/shared/utils";
import {
  QueryInput_VotingPowers_OrderBy,
  QueryInput_VotingPowers_OrderDirection,
  useGetVotingPowerChartQuery,
} from "@anticapture/graphql-client/hooks";
import React from "react";
import { useMemo } from "react";

const VotingPowerChartComponent = ({
  accountId,
  daoId,
  percentageChange,
  days,
}: {
  accountId: string;
  daoId: DaoIdEnum;
  percentageChange: number;
  days: TimeInterval;
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

  const votingPowerQuery = useGetVotingPowerChartQuery({
    variables: {
      account: accountId,
      limit: Number(days.replace("d", "")),
      orderBy: QueryInput_VotingPowers_OrderBy.Timestamp,
      orderDirection: QueryInput_VotingPowers_OrderDirection.Asc,
    },
    ...queryOptions,
    skip: !accountId,
  });

  const chartData =
    useMemo(() => {
      const votingPowers = votingPowerQuery.data?.votingPowers?.items || [];
      return (
        votingPowers.map((item) => ({
          high: item?.votingPower,
        })) || []
      );
    }, [votingPowerQuery.data?.votingPowers]) || [];

  if (votingPowerQuery.loading) {
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

export const VotingPowerChart = React.memo(VotingPowerChartComponent);
