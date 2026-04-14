import type { MetadataRoute } from "next";

import daoConfigByDaoId from "@/shared/dao-config";
import { getAllProposalPaths } from "@/shared/seo/graphql";
import { getSiteUrl } from "@/shared/seo/site";
import type { DaoIdEnum } from "@/shared/types/daos";

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
  "/governance",
  "/token-distribution",
  "/holders-and-delegates",
  "/activity-feed",
  "/resilience-stages",
  "/attack-profitability",
  "/service-providers",
];

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
      const paths = await getAllProposalPaths(
        daoId.toUpperCase() as DaoIdEnum,
      ).catch(() => []);

      return paths.map((path) => {
        const encodedId =
          path.kind === "offchain" ? encodeURIComponent(path.id) : path.id;
        const route =
          path.kind === "offchain"
            ? `/${daoId}/governance/offchain-proposal/${encodedId}`
            : `/${daoId}/governance/proposal/${encodedId}`;

        return {
          url: `${baseUrl}${route}`,
          changeFrequency: "daily" as const,
          priority: 0.7,
        };
      });
    }),
  );

  return [...staticEntries, ...daoEntries, ...proposalEntriesNested.flat()];
}
