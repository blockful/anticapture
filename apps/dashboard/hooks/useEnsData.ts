import useSWR from "swr";
import { Address } from "viem";

const ensUrl = "https://api.ensdata.net";

type EnsData = {
  address: Address;
  avatar_url: string;
  ens: string;
};

/* Fetch Dao Total Supply */
export const fetchEnsData = async ({
  address,
}: {
  address: Address;
}): Promise<EnsData> => {
  const response = await fetch(`${ensUrl}/${address}`, {
    next: { revalidate: 3600 },
  });
  return response.json();
};

export const useEnsData = (address: Address) => {
  const { data, error } = useSWR<EnsData>(
    address ? [`ensData`, address] : null,
    () => fetchEnsData({ address }),
  );
  return {
    data,
    error,
  };
};
