"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { Address } from "viem";
import { normalize } from "viem/ens";
import axios from "axios";

type EnsData = {
  address: Address;
  ens: string;
  avatarUrl: string | null;
};

type PrimaryNameResponse = {
  name?: string;
  accelerationRequested?: boolean;
  accelerationAttempted?: boolean;
};

/**
 * Hook to fetch ENS data for a single address
 * @param address - Ethereum address (e.g., "0x123...")
 * @returns Object containing ENS data, error, and loading state
 */
export const useEnsData = (
  address: Address | null | undefined,
  chainId: number,
) => {
  const { data, error, isLoading } = useQuery<EnsData>({
    queryKey: ["ensData", address ?? null],
    queryFn: () =>
      fetchEnsDataFromAddress({ address: address!, chainId: chainId }),
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
 * Checks if an ENS avatar exists using a HEAD request (no body download)
 * @param ensName - ENS name to check avatar for
 * @returns Promise resolving to avatar URL if exists, null otherwise
 */
const checkAvatarExists = async (ensName: string): Promise<string | null> => {
  const avatarUrl = `https://metadata.ens.domains/mainnet/avatar/${ensName}`;
  try {
    const response = await axios.head(avatarUrl);
    return response.status === 200 ? avatarUrl : null;
  } catch {
    return null;
  }
};

/**
 * Fetches ENS data using ENS Node API for a single address
 * @param address - Ethereum address
 * @returns Promise resolving to EnsData
 */
export const fetchEnsDataFromAddress = async ({
  address,
  chainId = 1,
}: {
  address: Address;
  chainId: number;
}): Promise<EnsData> => {
  let ensName: string | null = null;

  try {
    // Fetch primary ENS name
    const primaryNameUrl = `https://api.alpha.ensnode.io/api/resolve/primary-name/${address}/${chainId}?accelerate=true`;
    const primaryNameResponse =
      await axios.get<PrimaryNameResponse>(primaryNameUrl);
    ensName = primaryNameResponse.data.name || null;
  } catch (error) {
    // Silently fail and return empty data
    console.warn(`Failed to fetch ENS data for ${address}:`, error);
  }

  // Check if avatar exists (HEAD request, no body download)
  const avatar = ensName ? await checkAvatarExists(ensName) : null;

  return {
    address: address,
    ens: ensName || "",
    avatarUrl: avatar,
  };
};

type AddressRecordsResponse = {
  records?: {
    addresses?: Record<string, Address>;
  };
  accelerationRequested?: boolean;
  accelerationAttempted?: boolean;
};

export const fetchAddressFromEnsName = async ({
  ensName,
  coinType = "60",
}: {
  ensName: `${string}.eth`;
  coinType: string;
}): Promise<Address | null> => {
  try {
    const normalizedName = normalize(ensName);
    const url = `https://api.alpha.ensnode.io/api/resolve/records/${normalizedName}?addresses=${coinType}&accelerate=true`;
    const response = await axios.get<AddressRecordsResponse>(url);
    return response.data.records?.addresses?.[coinType] || null;
  } catch (error) {
    console.warn(`Failed to fetch address for ${ensName}:`, error);
    return null;
  }
};

/**
 * Hook to fetch ENS data for multiple addresses
 * @param addresses - Array of Ethereum addresses
 * @returns Object containing a map of addresses to ENS data, error, and loading state
 */
export const useMultipleEnsData = (addresses: Address[], chainId: number) => {
  // Deduplicate addresses to avoid unnecessary queries
  const uniqueAddresses = Array.from(new Set(addresses));
  const queries = useQueries({
    queries: uniqueAddresses.map((address) => ({
      queryKey: ["addressEns", address],
      queryFn: () => fetchEnsDataFromAddress({ address, chainId }),
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
