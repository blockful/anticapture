"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { Address, isAddress } from "viem";
import { normalize } from "viem/ens";
import { publicClient } from "@/shared/services/wallet/wallet";

type EnsData = {
  address: Address;
  avatar_url: string | null;
  ens: string;
  avatar: string | null;
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
 * Fetches ENS data using viem for a single address
 * @param address - Ethereum address
 * @returns Promise resolving to EnsData
 */
export const fetchEnsDataFromAddress = async ({
  address,
}: {
  address: Address;
}): Promise<EnsData> => {
  let ensName: string | null = null;
  let avatarUrl: string | null = null;

  if (isAddress(address)) {
    ensName = await publicClient.getEnsName({ address });
  }

  // Get avatar URL if we have an ENS name
  if (ensName) {
    avatarUrl = await publicClient.getEnsAvatar({ name: normalize(ensName) });
  }

  return {
    address: address,
    avatar_url: avatarUrl,
    ens: ensName || "",
    avatar: avatarUrl,
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
