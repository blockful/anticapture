import { useMemo } from "react";
import { useGetDelegateDelegationHistoryGraphQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimePeriod } from "@/features/holders-and-delegates/components/TimePeriodSwitcher";
import { SECONDS_PER_DAY } from "@/shared/constants/time-related";
import { formatUnits } from "viem";
import daoConfig from "@/shared/dao-config";

// Interface for a single delegation history item for the graph
export interface DelegationHistoryGraphItem {
  timestamp: number;
  votingPower: number;
  delta: string;
  type: "delegation" | "transfer";
  isGain: boolean;
  transactionHash: string;
  fromAddress?: string; // Address that initiated the transaction
  toAddress?: string; // Address that received the delegation/transfer
}

// Interface for the hook result
export interface UseDelegateDelegationHistoryGraphResult {
  delegationHistory: DelegationHistoryGraphItem[];
  loading: boolean;
  error: unknown;
}

export function useDelegateDelegationHistoryGraph(
  accountId: string,
  daoId: DaoIdEnum,
  timePeriod: TimePeriod = "all",
): UseDelegateDelegationHistoryGraphResult {
  const {
    daoOverview: { token },
  } = daoConfig[daoId];

  // Calculate timestamp range based on time period
  const { fromTimestamp, toTimestamp } = useMemo(() => {
    const nowInSeconds = Date.now() / 1000;

    // For "all", treat as all time by not setting limits
    if (timePeriod === "all") {
      return { fromTimestamp: undefined, toTimestamp: undefined };
    }

    let daysInSeconds: number;
    switch (timePeriod) {
      case "90d":
        daysInSeconds = 90 * SECONDS_PER_DAY;
        break;
      default:
        daysInSeconds = 30 * SECONDS_PER_DAY;
        break;
    }

    const fromTimestamp = Math.floor(nowInSeconds - daysInSeconds);
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
        // Convert from wei to token units using Viem's formatUnits
        const votingPower =
          token === "ERC20"
            ? Number(formatUnits(BigInt(item.votingPower.toString()), 18))
            : Number(item.votingPower.toString());
        const delta =
          token === "ERC20"
            ? Number(formatUnits(BigInt(item.delta.toString()), 18))
            : Number(item.delta.toString());
        const isGain = delta > 0;

        // Determine transaction type and extract address information
        const type: "delegation" | "transfer" = item.delegation
          ? "delegation"
          : "transfer";

        let fromAddress: string | undefined;
        let toAddress: string | undefined;

        if (item.delegation) {
          // For delegation: delegatorAccountId is the one delegating to delegateAccountId
          fromAddress = item.delegation.delegatorAccountId || undefined;
          toAddress = item.delegation.delegateAccountId || undefined;
        } else if (item.transfer) {
          // For transfer: fromAccountId is sending to toAccountId
          fromAddress = item.transfer.fromAccountId || undefined;
          toAddress = item.transfer.toAccountId || undefined;
        }

        return {
          timestamp: new Date(Number(item.timestamp) * 1000).getTime(),
          votingPower,
          delta: delta.toString(),
          type,
          isGain,
          transactionHash: item.transactionHash,
          fromAddress,
          toAddress,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp); // Sort chronologically for chart display
  }, [data, token]);

  return {
    delegationHistory,
    loading,
    error,
  };
}
