import { useMemo } from "react";
import { useGetDelegateDelegationHistoryGraphQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { VotingPowerTimePeriod } from "../components/DelegatesDelegationHistory/VotingPowerTimePeriodSwitcher";

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
  timePeriod: VotingPowerTimePeriod = "all",
): UseDelegateDelegationHistoryGraphResult {
  // Calculate timestamp range based on time period
  const { fromTimestamp, toTimestamp } = useMemo(() => {
    const now = Date.now();

    // For "all", treat as all time by not setting limits
    if (timePeriod === "all") {
      return { fromTimestamp: undefined, toTimestamp: undefined };
    }

    let daysInMs: number;
    switch (timePeriod) {
      case "30d":
        daysInMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case "90d":
        daysInMs = 90 * 24 * 60 * 60 * 1000;
        break;
      default:
        // Default to 30 days if unknown
        daysInMs = 30 * 24 * 60 * 60 * 1000;
        break;
    }

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
      orderDirection: "desc",
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

    return data.votingPowerHistorys.items
      .map((item) => {
        // Convert from wei to token units (divide by 10^18)
        const votingPowerWei = BigInt(item.votingPower.toString());
        const deltaWei = BigInt(item.delta.toString());

        const votingPower = Number(votingPowerWei) / Math.pow(10, 18);
        const delta = Number(deltaWei) / Math.pow(10, 18);
        const isGain = delta > 0;

        // Determine transaction type
        const type: "delegation" | "transfer" = item.delegation
          ? "delegation"
          : "transfer";

        return {
          timestamp: new Date(Number(item.timestamp) * 1000).getTime(),
          votingPower,
          delta: delta.toString(),
          type,
          isGain,
          transactionHash: item.transactionHash,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp); // Sort chronologically for chart display
  }, [data]);

  return {
    delegationHistory,
    loading,
    error,
  };
}
