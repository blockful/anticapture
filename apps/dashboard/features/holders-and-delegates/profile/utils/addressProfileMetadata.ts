import { getAddress as getAddressEnrichment } from "@anticapture/client";
import type { Metadata } from "next";
import { cache } from "react";
import type { Address } from "viem";

import daoConfigByDaoId from "@/shared/dao-config";
import { getServerGatefulConfig } from "@/shared/services/gatefulServerConfig";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatAddress } from "@/shared/utils/formatAddress";

// Metadata blocks the response, so a slow enrichment lookup must not hold the
// page: past this the title falls back to the shortened address.
const ENRICHMENT_TIMEOUT_MS = 2_000;

/** ENS name when there is one, the shortened address otherwise. */
export const getProfileDisplayName = cache(async (address: Address) => {
  const config = getServerGatefulConfig({ timeoutMs: ENRICHMENT_TIMEOUT_MS });
  if (!config) return formatAddress(address);

  try {
    const enrichment = await getAddressEnrichment(address, config);
    return enrichment?.ens?.name ?? formatAddress(address);
  } catch (error) {
    console.error("Failed to load address enrichment for metadata", error);
    return formatAddress(address);
  }
});

/**
 * Metadata shared by both shells. The whitelabel layout already appends the
 * DAO governance name through its title template, so it passes `withSiteName`
 * false and gets a bare title.
 */
export const buildAddressProfileMetadata = async ({
  daoId,
  address,
  canonicalPath,
  withSiteName,
}: {
  daoId: DaoIdEnum;
  address: Address;
  canonicalPath: string;
  withSiteName: boolean;
}): Promise<Metadata> => {
  const daoName = daoConfigByDaoId[daoId]?.name ?? daoId;
  const displayName = await getProfileDisplayName(address);

  const title = withSiteName
    ? `${displayName} · ${daoName} DAO profile - Anticapture`
    : `${displayName} · ${daoName} profile`;
  const description = `Voting power, delegators, votes and governance history of ${displayName} in ${daoName} DAO.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: { url: canonicalPath, title, description },
    twitter: { card: "summary", title, description },
  };
};
