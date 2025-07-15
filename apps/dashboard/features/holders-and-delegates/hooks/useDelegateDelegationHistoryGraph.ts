import { useMemo } from "react";
import { useGetDelegateDelegationHistoryGraphQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";

// Interface for a single delegation history item for the graph
export interface DelegationHistoryGraphItem {
  timestamp: number;
  votingPower: number;
  delta: string;
  type: "delegation" | "transfer";
  isGain: boolean;
  transactionHash: string;
}

// Interface for the hook result
export interface UseDelegateDelegationHistoryGraphResult {
  delegationHistory: DelegationHistoryGraphItem[];
  loading: boolean;
  error: any;
}

export function useDelegateDelegationHistoryGraph(
  accountId: string,
  daoId: DaoIdEnum,
  timePeriod: "30d" | "90d" | "all" = "all",
): UseDelegateDelegationHistoryGraphResult {
  // Calculate timestamp range based on time period
  const { fromTimestamp, toTimestamp } = useMemo(() => {
    const now = Date.now();

    if (timePeriod === "all") {
      return { fromTimestamp: undefined, toTimestamp: undefined };
    }

    const daysInMs =
      timePeriod === "30d"
        ? 30 * 24 * 60 * 60 * 1000
        : 90 * 24 * 60 * 60 * 1000;
    const fromTimestamp = Math.floor((now - daysInMs) / 1000);
    const toTimestamp = Math.floor(now / 1000);

    return { fromTimestamp, toTimestamp };
  }, [timePeriod]);

  const { data, loading, error } = useGetDelegateDelegationHistoryGraphQuery({
    variables: {
      accountId,
      fromTimestamp,
      toTimestamp,
      orderBy: "timestamp",
      orderDirection: "asc",
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !accountId,
    fetchPolicy: "cache-and-network",
  });

  const delegationHistory = useMemo((): DelegationHistoryGraphItem[] => {
    if (!data?.votingPowerHistorys?.items) {
      return [];
    }

    return data.votingPowerHistorys.items.map((item) => {
      const delta = item.delta.toString();
      const deltaNum = parseFloat(delta);
      const isGain = deltaNum > 0;

      // Determine transaction type
      const type = item.delegation ? "delegation" : "transfer";

      return {
        timestamp: new Date(Number(item.timestamp) * 1000).getTime(),
        votingPower: parseFloat(item.votingPower.toString()),
        delta,
        type,
        isGain,
        transactionHash: item.transactionHash,
      };
    });
  }, [data]);

  return {
    delegationHistory,
    loading,
    error,
  };
}
