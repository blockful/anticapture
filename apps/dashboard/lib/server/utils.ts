import { publicClient } from "@/lib/wallet";
import { Address } from "viem";

export type User = {
  walletAddress: Address;
  ensName: string | null;
};

export const BACKEND_ENDPOINT =
  "https://staging.api.defendao.com";

export const bulkGetEnsName = async (addresses: Address[]) => {
  const names = [];

  for (let i = 0; i < addresses.length; i++) {
    let ensName = await publicClient.getEnsName({ address: addresses[i] });

    names.push(ensName);
  }

  return names;
};
