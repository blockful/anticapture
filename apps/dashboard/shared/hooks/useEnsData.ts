"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { Address, isAddress } from "viem";
import { normalize } from "viem/ens";
import { publicClient } from "@/shared/services/wallet/wallet";
import axios from "axios";

type EnsData = {
  address: Address;
  avatar_url: string | null;
  ens: string;
  avatar: string | null;
};

// Fallback API types
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

/**
 * Hook to fetch ENS data for a single address
 * @param address - Ethereum address (e.g., "0x123...")
 * @returns Object containing ENS data, error, and loading state
 */
export const useEnsData = (address: Address | null | undefined) => {
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
 * Builds the ENS API URL for the fallback service
 * @param address - Ethereum address or ENS name
 * @returns API URL string
 */
const getEnsApiUrl = (address: Address | `${string}.eth`): string => {
  return `https://api.ethfollow.xyz/api/v1/users/${address}/ens`;
};

/**
 * Fetches ENS data from the fallback API service
 * @param address - Ethereum address
 * @returns Promise resolving to EnsData or null if request fails
 */
const fetchEnsDataFromApi = async ({
  address,
}: {
  address: Address;
}): Promise<EnsData | null> => {
  try {
    const response = await axios.get<EnsApiResponse>(getEnsApiUrl(address), {
      timeout: 5000, // 5 second timeout
    });

    const { ens } = response.data;

    return {
      address: ens.address,
      avatar_url: ens.avatar,
      ens: ens.name || "",
      avatar: ens.avatar,
    };
  } catch (error) {
    // Silently fail - this is a fallback, so we don't want to throw
    return null;
  }
};

/**
 * Fetches ENS data using viem for a single address
 * Falls back to external API only if viem throws an error (not if address has no ENS)
 * @param address - Ethereum address
 * @returns Promise resolving to EnsData
 */
export const fetchEnsDataFromAddress = async ({
  address,
}: {
  address: Address;
}): Promise<EnsData> => {
  // Try primary method: viem publicClient
  try {
    if (!isAddress(address)) {
      // Invalid address, return empty data
      return {
        address: address,
        avatar_url: null,
        ens: "",
        avatar: null,
      };
    }

    const ensName = await publicClient.getEnsName({ address });

    // If address has no ENS name, return empty data (this is normal, not an error)
    if (!ensName) {
      return {
        address: address,
        avatar_url: null,
        ens: "",
        avatar: null,
      };
    }

    // Address has ENS name, try to get avatar
    let avatarUrl: string | null = null;
    avatarUrl = await publicClient.getEnsAvatar({ name: normalize(ensName) });

    return {
      address: address,
      avatar_url: avatarUrl,
      ens: ensName,
      avatar: avatarUrl,
    };
  } catch (error) {
    // Primary method threw an error (network issue, RPC error, etc.)
    const fallbackData = await fetchEnsDataFromApi({ address });
    if (fallbackData) {
      return fallbackData;
    }

    // If fallback also fails, return empty data
    return {
      address: address,
      avatar_url: null,
      ens: "",
      avatar: null,
    };
  }
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
