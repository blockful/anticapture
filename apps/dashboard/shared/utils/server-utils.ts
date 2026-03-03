import { Address } from "viem";

import { publicClient } from "@/shared/services/wallet/wallet";

export type User = {
  walletAddress: Address;
  ensName: string | null;
};

export const BACKEND_ENDPOINT = process.env.NEXT_PUBLIC_BASE_URL;

export const getAuthHeaders = (): Record<string, string> => ({
  ...(process.env.NEXT_PUBLIC_API_TOKEN && {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
  }),
});

export const bulkGetEnsName = async (addresses: Address[]) => {
  const names = [];

  for (let i = 0; i < addresses.length; i++) {
    let ensName = await publicClient.getEnsName({ address: addresses[i] });

    names.push(ensName);
  }

  return names;
};
