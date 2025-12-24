"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import axios from "axios";
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
    avatar: string | null;
    records: EnsRecords | null;
    updated_at: string;
  };
};

type EnsData = {
  address: Address;
  avatar_url: string | null;
  ens: string;
  avatar: string | null;
};

/**
 * Hook to fetch ENS data for a single address or ENS name
 * @param address - Ethereum address or ENS name (e.g., "0x123..." or "vitalik.eth")
 * @returns Object containing ENS data, error, and loading state
 */
export const useEnsData = (
  address: Address | `${string}.eth` | null | undefined,
) => {
  const { data, error, isLoading } = useQuery<EnsData>({
    queryKey: ["ensData", address ?? null],
    queryFn: () => fetchEnsDataFromAddress({ address: address! }),
    enabled: !!address,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 60 * 24, // Consider data fresh for 24 hours
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  });
  return {
    data,
    error,
    isLoading,
  };
};

/**
 * Fetches ENS data from the API for a single address or ENS name
 * @param address - Ethereum address or ENS name
 * @returns Promise resolving to EnsData
 * @throws Error if the API request fails or response is invalid
 */
export const fetchEnsDataFromAddress = async ({
  address,
}: {
  address: Address | `${string}.eth`;
}): Promise<EnsData> => {
  const response = await axios.get<EnsApiResponse>(getEnsUrl(address));
  const data = response.data;

  // Validate response structure
  if (!data?.ens) {
    throw new Error("Invalid ENS API response: missing ens field");
  }

  if (!data.ens.address) {
    throw new Error("Invalid ENS API response: missing address field");
  }

  // Empty name is valid (means no ENS name exists for this address)
  // Transform API response to match expected EnsData structure
  return {
    address: data.ens.address,
    avatar_url: data.ens.avatar,
    ens: data.ens.name,
    avatar: data.ens.avatar,
  };
};

export const fetchAddressFromEnsName = async ({
  ensName,
}: {
  ensName: `${string}.eth`;
}): Promise<Address | null> => {
  const address = await publicClient.getEnsAddress({
    name: normalize(ensName),
  });
  return address || null;
};

/**
 * Hook to fetch ENS data for multiple addresses
 * @param addresses - Array of Ethereum addresses
 * @returns Object containing a map of addresses to ENS data, error, and loading state
 */
export const useMultipleEnsData = (addresses: Address[]) => {
  // Deduplicate addresses to avoid unnecessary queries
  const uniqueAddresses = Array.from(new Set(addresses));

  const queries = useQueries({
    queries: uniqueAddresses.map((address) => ({
      queryKey: ["addressEns", address],
      queryFn: () => fetchEnsDataFromAddress({ address }),
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60 * 60 * 24, // Consider data fresh for 24 hours
      gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    })),
  });

  // Transform the array of query results into Record<Address, EnsData>
  const data: Record<Address, EnsData> = {};
  queries.forEach((query, index) => {
    if (query.data) {
      data[uniqueAddresses[index]] = query.data;
    }
  });

  const isLoading = queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error;

  return {
    data,
    error,
    isLoading,
  };
};
