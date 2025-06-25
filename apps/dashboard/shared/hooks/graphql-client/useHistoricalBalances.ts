import {
  QueryInput_HistoricalBalances_DaoId,
  useGetHistoricalBalancesQuery,
} from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { useEffect, useState } from "react";
import { TimeInterval } from "@/shared/types/enums";
import { BlockchainEnum } from "@/shared/types/blockchains";
import { getHistoricalBlockNumber } from "@/shared/utils/calculateHistoricalBlockNumber";

interface HistoricalBalance {
  address: string;
  balance: string;
  blockNumber: string;
  tokenAddress: string;
}

interface UseHistoricalBalancesResult {
  data: HistoricalBalance[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useHistoricalBalances = (
  daoId: DaoIdEnum,
  addresses: string[],
  days: TimeInterval,
): UseHistoricalBalancesResult => {
  const [blockNumber, setBlockNumber] = useState<number>(0);

  useEffect(() => {
    const fetchBlockNumber = async () => {
      try {
        const historicalBlock = await getHistoricalBlockNumber({
          period: days,
          blockchain: BlockchainEnum.ETHEREUM,
        });

        setBlockNumber(Math.abs(historicalBlock));
      } catch (error) {
        console.error("Error fetching historical block:", error);
        setBlockNumber(0);
      }
    };

    fetchBlockNumber();
  }, [days]);

  const { data, loading, error, refetch } = useGetHistoricalBalancesQuery({
    variables: {
      addresses,
      blockNumber,
      daoId: daoId as unknown as QueryInput_HistoricalBalances_DaoId,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: blockNumber === 0 || !addresses.length,
  });

  return {
    data: data?.historicalBalances as HistoricalBalance[] | null,
    loading,
    error: error || null,
    refetch: () => refetch(),
  };
};
