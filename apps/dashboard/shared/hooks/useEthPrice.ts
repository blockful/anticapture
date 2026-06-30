import { useQuery } from "@tanstack/react-query";

const fetchEthPrice = async (): Promise<number> => {
  // Via the /api/coingecko proxy.
  const res = await fetch("/api/coingecko?kind=eth");
  if (!res.ok) throw new Error(`ETH price error: ${res.status}`);
  const data = (await res.json()) as { usd?: number | null };
  const price = data?.usd;
  if (price === undefined || price === null)
    throw new Error("ETH price missing from response");
  return price;
};

export const useEthPrice = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["eth-price"],
    queryFn: fetchEthPrice,
    staleTime: 60_000,
  });

  return {
    price: data ?? null,
    isLoading,
    error: error instanceof Error ? error : null,
  };
};
