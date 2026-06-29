import { useQuery } from "@tanstack/react-query";

const fetchTokenPrice = async (
  chainId: number,
  address: string,
): Promise<number | null> => {
  // Proxied through our own API route so the request shares a cached, optionally
  // keyed CoinGecko call instead of hitting the public rate-limited endpoint
  // from every browser. See app/api/coingecko/route.ts.
  const params = new URLSearchParams({
    kind: "token",
    chainId: String(chainId),
    address,
  });
  const res = await fetch(`/api/coingecko?${params.toString()}`);
  if (!res.ok) throw new Error(`Token price error: ${res.status}`);
  const data = (await res.json()) as { usd?: number | null };
  return data?.usd ?? null;
};

/**
 * Resolves the USD price of an arbitrary ERC-20 by contract address via the
 * CoinGecko proxy. Returns `price: null` when no address/chain is given or the
 * token has no listing — callers should degrade gracefully (no USD shown)
 * rather than treat it as an error.
 */
export const useTokenPrice = (
  tokenAddress: string | undefined,
  chainId: number | undefined,
) => {
  const enabled = Boolean(chainId && tokenAddress);

  const { data, isLoading, error } = useQuery({
    queryKey: ["token-price", chainId, tokenAddress?.toLowerCase()],
    queryFn: async () => {
      if (!chainId || !tokenAddress) return null;
      return fetchTokenPrice(chainId, tokenAddress.toLowerCase());
    },
    enabled,
    staleTime: 60_000,
  });

  return {
    price: data ?? null,
    isLoading,
    error: error instanceof Error ? error : null,
  };
};
