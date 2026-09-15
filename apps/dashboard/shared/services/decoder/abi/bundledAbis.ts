import type { Abi } from "viem";

import ensGovernorAbi from "@/abis/ens-governor.json";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import {
  fetchVerifiedAbi,
  parseAbiStrict,
} from "@/shared/services/decoder/abi/etherscan";

const BUNDLED_GOVERNOR_ABIS: Partial<Record<DaoIdEnum, unknown>> = {
  ENS: ensGovernorAbi,
};

type BundledEntry = { chainId: number; address: string; abi: Abi };

// Built lazily: dao-config is a large module graph and the map is only needed
// once a decode actually happens.
let bundledEntries: BundledEntry[] | null = null;

const getBundledEntries = (): BundledEntry[] => {
  if (bundledEntries) return bundledEntries;
  bundledEntries = [];
  for (const [daoId, rawAbi] of Object.entries(BUNDLED_GOVERNOR_ABIS)) {
    const config = daoConfig[daoId as DaoIdEnum];
    const governor = config?.daoOverview?.contracts?.governor;
    const chainId = config?.daoOverview?.chain?.id;
    if (!governor || !chainId) continue;
    const validated = parseAbiStrict(rawAbi);
    if (!validated) continue;
    bundledEntries.push({
      chainId,
      address: governor.toLowerCase(),
      abi: validated,
    });
  }
  return bundledEntries;
};

/** ABI shipped with the app for a known contract, keyed by chain + address. */
export const getBundledAbi = (chainId: number, address: string): Abi | null =>
  getBundledEntries().find(
    (entry) =>
      entry.chainId === chainId && entry.address === address.toLowerCase(),
  )?.abi ?? null;

/**
 * DAO-scoped lookup used by the create-proposal flow: bundled ABI first, then
 * the verified ABI from Etherscan on the DAO's chain.
 */
export const lookupDaoContractAbi = (
  daoId: string,
  address: string,
): Promise<Abi | null> => {
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const chainId = daoConfig[daoIdEnum]?.daoOverview?.chain?.id;
  if (!chainId) return Promise.resolve(null);
  const bundled = getBundledAbi(chainId, address);
  if (bundled) return Promise.resolve(bundled);
  return fetchVerifiedAbi(chainId, address);
};
