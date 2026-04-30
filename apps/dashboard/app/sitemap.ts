import type { MetadataRoute } from "next";

import daoConfigByDaoId from "@/shared/dao-config";
import { getSiteUrl } from "@/shared/seo/site";
import type { DaoIdEnum } from "@/shared/types/daos";
import {
  type OffchainProposalsPathParams,
  type ProposalsPathParams,
  offchainProposals,
  proposals,
} from "@anticapture/client";

export const dynamic = "force-dynamic";

const PROPOSAL_PAGE_LIMIT = 100;
const PROPOSAL_PATHS_TIMEOUT_MS = 5_000;

const STATIC_ROUTES = [
  "/",
  "/faq",
  "/glossary",
  "/alerts",
  "/contact",
  "/donate",
  "/terms-of-service",
];

const DAO_SUB_ROUTES = [
  "",
  "/risk-analysis",
  "/proposals",
  "/token-distribution",
  "/holders-and-delegates",
  "/activity-feed",
  "/resilience-stages",
  "/attack-profitability",
  "/service-providers",
];

export interface ProposalPath {
  id: string;
  kind: "onchain" | "offchain";
}

interface ProposalPage<TItem extends { id: string }> {
  items: TItem[];
  totalCount: number;
}

export function getProposalSitemapRoute(
  daoId: string,
  path: ProposalPath,
): string {
  const encodedId =
    path.kind === "offchain" ? encodeURIComponent(path.id) : path.id;

  return path.kind === "offchain"
    ? `/${daoId}/governance/offchain-proposal/${encodedId}`
    : `/${daoId}/proposals/${encodedId}`;
}

async function withTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs: number,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((resolve) => {
    timeout = setTimeout(() => resolve(fallback), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}

async function getAllProposalPages<TItem extends { id: string }>(
  getPage: (params: {
    skip: number;
    limit: number;
  }) => Promise<ProposalPage<TItem>>,
): Promise<TItem[]> {
  const items: TItem[] = [];

  for (let skip = 0; ; skip += PROPOSAL_PAGE_LIMIT) {
    const page = await getPage({ skip, limit: PROPOSAL_PAGE_LIMIT });
    items.push(...page.items);

    if (
      items.length >= page.totalCount ||
      page.items.length < PROPOSAL_PAGE_LIMIT
    ) {
      return items;
    }
  }
}

export async function getAllProposalPaths(
  daoId: DaoIdEnum,
): Promise<ProposalPath[]> {
  const onchainDao = daoId.toLowerCase() as ProposalsPathParams["dao"];
  const offchainDao = daoId.toLowerCase() as OffchainProposalsPathParams["dao"];

  const [onchainItems, offchainItems] = await Promise.all([
    getAllProposalPages((params) => proposals(onchainDao, params)),
    getAllProposalPages((params) => offchainProposals(offchainDao, params)),
  ]);

  return [
    ...onchainItems.map((item) => ({
      id: item.id,
      kind: "onchain" as const,
    })),
    ...offchainItems.map((item) => ({
      id: item.id,
      kind: "offchain" as const,
    })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const daoIds = Object.keys(daoConfigByDaoId).map((id) => id.toLowerCase());

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: "monthly",
    priority: route === "/" ? 1.0 : 0.5,
  }));

  const daoEntries: MetadataRoute.Sitemap = daoIds.flatMap((daoId) =>
    DAO_SUB_ROUTES.map((sub) => ({
      url: `${baseUrl}/${daoId}${sub}`,
      changeFrequency: "daily" as const,
      priority: sub === "" ? 0.8 : 0.6,
    })),
  );

  const proposalEntriesNested = await Promise.all(
    daoIds.map(async (daoId) => {
      const paths = await withTimeout(
        getAllProposalPaths(daoId.toUpperCase() as DaoIdEnum).catch(() => []),
        [],
        PROPOSAL_PATHS_TIMEOUT_MS,
      );

      return paths.map((path: ProposalPath) => {
        return {
          url: `${baseUrl}${getProposalSitemapRoute(daoId, path)}`,
          changeFrequency: "daily" as const,
          priority: 0.7,
        };
      });
    }),
  );

  return [...staticEntries, ...daoEntries, ...proposalEntriesNested.flat()];
}
