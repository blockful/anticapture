import { useQuery } from "@tanstack/react-query";

// CoinGecko "asset platform" id per EVM chain. The create-proposal flow is ENS /
// mainnet today; extend this map as more chains gain proposal support.
const COINGECKO_PLATFORM_BY_CHAIN: Record<number, string> = {
  1: "ethereum",
};

const fetchTokenPrice = async (
  platform: string,
  address: string,
): Promise<number | null> => {
  const url = `https://api.coingecko.com/api/v3/simple/token_price/${platform}?contract_addresses=${address}&vs_currencies=usd`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = (await res.json()) as Record<string, { usd?: number }>;
  return data?.[address.toLowerCase()]?.usd ?? null;
};

/**
 * Resolves the USD price of an arbitrary ERC-20 by contract address via
 * CoinGecko's token-price endpoint. Returns `price: null` when the chain is
 * unsupported, no address is given, or the token has no listing — callers
 * should degrade gracefully (no USD shown) rather than treat it as an error.
 */
export const useTokenPrice = (
  tokenAddress: string | undefined,
  chainId: number | undefined,
) => {
  const platform = chainId ? COINGECKO_PLATFORM_BY_CHAIN[chainId] : undefined;
  const enabled = Boolean(platform && tokenAddress);

  const { data, isLoading, error } = useQuery({
    queryKey: ["token-price", platform, tokenAddress?.toLowerCase()],
    queryFn: async () => {
      if (!platform || !tokenAddress) return null;
      return fetchTokenPrice(platform, tokenAddress.toLowerCase());
    },
    enabled,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  return {
    price: data ?? null,
    isLoading,
    error: error instanceof Error ? error : null,
  };
};
