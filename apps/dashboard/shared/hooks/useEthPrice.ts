import { useQuery } from "@tanstack/react-query";

const fetchEthPrice = async (): Promise<number> => {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
  );
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = (await res.json()) as { ethereum?: { usd?: number } };
  const price = data?.ethereum?.usd;
  if (price === undefined) throw new Error("ETH price missing from response");
  return price;
};

export const useEthPrice = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["eth-price"],
    queryFn: fetchEthPrice,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  return {
    price: data ?? null,
    isLoading,
    error: error instanceof Error ? error : null,
  };
};
