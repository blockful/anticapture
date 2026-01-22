import { useMemo } from "react";
import {
  QueryInput_HistoricalVotingPowers_OrderDirection,
  useGetDelegateDelegationHistoryGraphQuery,
} from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { formatUnits } from "viem";
import daoConfig from "@/shared/dao-config";
import { QueryInput_HistoricalVotingPowers_OrderBy } from "@anticapture/graphql-client";

// Interface for a single delegation history item for the graph
export interface DelegationHistoryGraphItem {
  timestamp: number;
  votingPower: number;
  delta: number;
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
  fromTimestamp?: string,
  toTimestamp?: string,
): UseDelegateDelegationHistoryGraphResult {
  const { decimals } = daoConfig[daoId];

  const { data, loading, error } = useGetDelegateDelegationHistoryGraphQuery({
    variables: {
      accountId,
      fromTimestamp,
      toTimestamp,
      orderBy: QueryInput_HistoricalVotingPowers_OrderBy.Timestamp,
      orderDirection: QueryInput_HistoricalVotingPowers_OrderDirection.Asc,
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
    if (!data?.historicalVotingPowers?.items) {
      return [];
    }

    return data.historicalVotingPowers.items
      .filter((item) => !!item)
      .map((item) => {
        const delta = Number(
          formatUnits(BigInt(item.delta.toString()), decimals),
        );
        return {
          timestamp: new Date(Number(item.timestamp) * 1000).getTime(),
          votingPower: Number(
            formatUnits(BigInt(item.votingPower.toString()), decimals),
          ),
          delta,
          type: item.delegation ? "delegation" : "transfer",
          isGain: delta > 0,
          transactionHash: item.transactionHash,
          fromAddress: item.delegation?.from || item.transfer?.from,
          toAddress: item.delegation?.to || item.transfer?.to,
        };
      });
  }, [data, decimals]);

  return {
    delegationHistory,
    loading,
    error,
  };
}
