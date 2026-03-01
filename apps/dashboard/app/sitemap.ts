import { MetadataRoute } from "next";

import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { ALL_DAOS } from "@/shared/types/daos";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

const daoSubPages = [
  PAGES_CONSTANTS.daoOverview.page,
  PAGES_CONSTANTS.attackProfitability.page,
  PAGES_CONSTANTS.holdersAndDelegates.page,
  PAGES_CONSTANTS.activityFeed.page,
  PAGES_CONSTANTS.tokenDistribution.page,
  PAGES_CONSTANTS.governanceImplementation.page,
  PAGES_CONSTANTS.attackExposure.page,
  PAGES_CONSTANTS.resilienceStages.page,
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/${PAGES_CONSTANTS.glossary.page}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/${PAGES_CONSTANTS.faq.page}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/${PAGES_CONSTANTS.donate.page}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/${PAGES_CONSTANTS.contact.page}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/${PAGES_CONSTANTS.alerts.page}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const daoPages: MetadataRoute.Sitemap = ALL_DAOS.flatMap((daoId) => {
    const daoPath = daoId.toLowerCase();
    return daoSubPages.map((subPage) => ({
      url:
        subPage === "/"
          ? `${baseUrl}/${daoPath}`
          : `${baseUrl}/${daoPath}/${subPage}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: subPage === "/" ? 0.9 : 0.8,
    }));
  });

  return [...staticPages, ...daoPages];
}
