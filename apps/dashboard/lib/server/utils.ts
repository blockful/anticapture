import { publicClient } from "../wallet";

export type User = {
  walletAddress: `0x${string}`;
  ensName: string | null;
};

export const BACKEND_ENDPOINT =
  "https://gov-indexer-backend-production.up.railway.app";

export const bulkGetEnsName = async (addresses: `0x${string}`[]) => {
  const names = [];

  for (let i = 0; i < addresses.length; i++) {
    let ensName = await publicClient.getEnsName({ address: addresses[i] });

    names.push(ensName);
  }

  return names;
};
