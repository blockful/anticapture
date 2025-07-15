"use client";

import { default as useSWR } from "swr";
import { Address } from "viem";

const ensUrl = "https://api.ensdata.net";

type EnsData = {
  address: Address;
  avatar_url: string;
  ens: string;
  avatar: string;
};

/* Fetch Dao Total Supply */
export const fetchEnsData = async ({
  address,
}: {
  address: Address;
}): Promise<EnsData> => {
  const response = await fetch(`${ensUrl}/${address}`);
  return response.json();
};

export const useEnsData = (address: Address) => {
  const { data, error, isLoading } = useSWR<EnsData>(
    address ? [`ensData`, address] : null,
    () => fetchEnsData({ address }),
    {
      revalidateOnFocus: false,
    },
  );
  return {
    data,
    error,
    isLoading,
  };
};
