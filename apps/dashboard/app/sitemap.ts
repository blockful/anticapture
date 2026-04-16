import type { MetadataRoute } from "next";

import daoConfigByDaoId from "@/shared/dao-config";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
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

  return [...staticEntries, ...daoEntries];
}
