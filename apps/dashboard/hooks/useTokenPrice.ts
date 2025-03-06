import useSWR from "swr";
import daoConstantsByDaoId from "@/lib/dao-constants";
import { ChainNameEnum } from "@/lib/dao-constants/types";
import { DaoIdEnum } from "@/lib/types/daos";

/* Fetch Dao Token price from Defi Llama API */
export const fetchTokenPrice = async (
  chainName: ChainNameEnum,
  daoId: DaoIdEnum,
) => {
  const daoToken = daoConstantsByDaoId[daoId].contracts.token;

  try {
    const url = `https://coins.llama.fi/prices/current/${chainName}:${daoToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.coins) {
      const tokenData = data.coins[`${chainName}:${daoToken}`];
      return tokenData.price;
    } else {
      throw new Error("Token price not found");
    }
  } catch (error) {
    throw new Error("Error fetching token price:");
  }
};

/**
 * Hook to fetch and manage token price data using SWR
 * @param chainName - The blockchain network name
 * @param daoId - The DAO identifier
 * @returns Object containing price data, loading state, and error state
 */
export const useFetchTokenPrice = (
  chainName: ChainNameEnum,
  daoId: DaoIdEnum,
) => {
  const fetcher = () => fetchTokenPrice(chainName, daoId);

  const { data, error, isLoading } = useSWR(
    `token-price-${chainName}-${daoId}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
      dedupingInterval: 10000, // Dedupe requests within 10 seconds
    },
  );

  return {
    price: data,
    loading: isLoading,
    error: error as Error | null,
  };
};
