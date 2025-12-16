"use client";

import { default as useSWR } from "swr";
import { Address } from "viem";

const getEnsUrl = (address: Address | `${string}.eth`) => {
  return `https://api.ethfollow.xyz/api/v1/users/${address}/ens`;
};

type EnsRecords = {
  avatar?: string;
  "com.discord"?: string;
  "com.github"?: string;
  "com.twitter"?: string;
  description?: string;
  email?: string;
  header?: string;
  location?: string;
  name?: string;
  "org.telegram"?: string;
  url?: string;
  [key: string]: string | undefined;
};

type EnsApiResponse = {
  ens: {
    name: string;
    address: Address;
    avatar: string;
    records: EnsRecords;
    updated_at: string;
  };
};

type EnsData = {
  address: Address;
  avatar_url: string;
  ens: string;
  avatar: string;
};

export const fetchEnsData = async ({
  address,
}: {
  address: Address | `${string}.eth`;
}): Promise<EnsData> => {
  const response = await fetch(getEnsUrl(address));
  const data: EnsApiResponse = await response.json();

  // Transform API response to match expected EnsData structure
  return {
    address: data.ens.address,
    avatar_url: data.ens.records.avatar || data.ens.avatar || "",
    ens: data.ens.name,
    avatar: data.ens.avatar || data.ens.records.avatar || "",
  };
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
