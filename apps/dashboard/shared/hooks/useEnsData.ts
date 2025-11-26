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
  address: Address | `${string}.eth`;
}): Promise<EnsData> => {
  const response = await fetch(`${ensUrl}/${address}`);
  return response.json();
};

/* Fetch multiple ENS data */
export const fetchMultipleEnsData = async (
  addresses: Address[],
): Promise<Record<Address, EnsData>> => {
  const promises = addresses.map(async (address) => {
    try {
      const data = await fetchEnsData({ address });
      return { address, data };
    } catch (error) {
      return { address, data: null };
    }
  });

  const results = await Promise.all(promises);

  const ensDataMap: Record<Address, EnsData> = {};
  results.forEach(({ address, data }) => {
    if (data) {
      ensDataMap[address] = data;
    }
  });

  return ensDataMap;
};

export const useEnsData = (address: Address | `${string}.eth`) => {
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

export const useMultipleEnsData = (addresses: Address[]) => {
  const { data, error, isLoading } = useSWR<Record<Address, EnsData>>(
    addresses.length > 0
      ? [`multipleEnsData`, addresses.sort().join(",")]
      : null,
    () => fetchMultipleEnsData(addresses),
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
