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
    const nowInSeconds = Date.now()/1000;

    // For "all", treat as all time by not setting limits
    if (timePeriod === "all") {
      return { fromTimestamp: undefined, toTimestamp: undefined };
    }

    let daysInSeconds: number;
    switch (timePeriod) {
      case "30d":
        daysInSeconds = 30 * SECONDS_PER_DAY;
        break;
      case "90d":
        daysInSeconds = 90  * SECONDS_PER_DAY;
        break;
      default:
        // Default to 30 days if unknown
        daysInSeconds = 30 * SECONDS_PER_DAY;
        break;
    }

    const fromTimestamp = Math.floor((nowInSeconds - daysInSeconds));
    const toTimestamp = Math.floor(nowInSeconds);

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
