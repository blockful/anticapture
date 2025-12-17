"use client";

import { useQuery } from "@tanstack/react-query";
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
  avatar_url: string;
  ens: string;
  avatar: string;
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
    queryFn: () => fetchEnsData({ address: address! }),
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
export const fetchEnsData = async ({
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
    avatar_url: data.ens.avatar || "",
    ens: data.ens.name || "",
    avatar: data.ens.avatar || data.ens.records?.avatar || "",
  };
};

/**
 * Hook to fetch ENS data for multiple addresses
 * @param addresses - Array of Ethereum addresses
 * @returns Object containing a map of addresses to ENS data, error, and loading state
 */
export const useMultipleEnsData = (addresses: Address[]) => {
  // Deduplicate and sort addresses for stable query key
  const uniqueAddresses = Array.from(new Set(addresses)).sort();

  const { data, error, isLoading } = useQuery<Record<Address, EnsData>>({
    queryKey: ["multipleEnsData", uniqueAddresses.join(",")],
    queryFn: () => fetchMultipleEnsData(uniqueAddresses),
    enabled: uniqueAddresses.length > 0,
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
 * Fetches ENS data for multiple addresses in parallel
 * @param addresses - Array of Ethereum addresses (will be deduplicated)
 * @returns Promise resolving to a map of addresses to ENS data
 */
export const fetchMultipleEnsData = async (
  addresses: Address[],
): Promise<Record<Address, EnsData>> => {
  // Deduplicate addresses to avoid unnecessary API calls
  const uniqueAddresses = Array.from(new Set(addresses));

  if (uniqueAddresses.length === 0) {
    return {};
  }

  const promises = uniqueAddresses.map(async (address) => {
    try {
      const data = await fetchEnsData({ address });
      return { address, data };
    } catch (error) {
      // Log error for debugging but don't throw to allow partial results
      console.warn(`Failed to fetch ENS data for ${address}:`, error);
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
