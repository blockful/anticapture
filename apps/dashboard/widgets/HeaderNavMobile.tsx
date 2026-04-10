"use client";

import { useParams, usePathname, useRouter } from "next/navigation";

import { Select } from "@/shared/components/design-system/form/fields/select/Select";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export const HeaderNavMobile = () => {
  const { daoId }: { daoId: string } = useParams();
  const pathname = usePathname();
  const router = useRouter();

  if (!daoId) {
    return null;
  }
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum];

  const options = [
    {
      page: PAGES_CONSTANTS.daoOverview.page,
      title: PAGES_CONSTANTS.daoOverview.title,
      enabled: daoConfig.overviewPage !== false && !!daoConfig.daoOverview,
    },
    {
      page: PAGES_CONSTANTS.holdersAndDelegates.page,
      title: PAGES_CONSTANTS.holdersAndDelegates.title,
      enabled: !!daoConfig.dataTables,
    },
    {
      page: "governance",
      title: "Proposals",
      enabled: !!daoConfig.governancePage,
    },
    {
      page: PAGES_CONSTANTS.activityFeed.page,
      title: PAGES_CONSTANTS.activityFeed.title,
      enabled: !!daoConfig.activityFeed,
    },
    {
      page: PAGES_CONSTANTS.attackProfitability.page,
      title: PAGES_CONSTANTS.attackProfitability.title,
      enabled: !!daoConfig.attackProfitability?.supportsLiquidTreasuryCall,
    },
    {
      page: PAGES_CONSTANTS.resilienceStages.page,
      title: PAGES_CONSTANTS.resilienceStages.title,
      enabled: !!daoConfig.resilienceStages,
    },
    {
      page: PAGES_CONSTANTS.attackExposure.page,
      title: PAGES_CONSTANTS.attackExposure.title,
      enabled: !!daoConfig.attackExposure,
    },
    {
      page: PAGES_CONSTANTS.tokenDistribution.page,
      title: PAGES_CONSTANTS.tokenDistribution.title,
      enabled: !!daoConfig.tokenDistribution,
    },
    {
      page: PAGES_CONSTANTS.serviceProviders.page,
      title: PAGES_CONSTANTS.serviceProviders.title,
      enabled: !!daoConfig.serviceProviders,
    },
  ];

  const enabledOptions = options.filter((o) => o.enabled);
  const items = enabledOptions.map((o) => ({ value: o.page, label: o.title }));

  const isDaoOverviewPage =
    pathname === `/${daoId}` || pathname === `/${daoId}/`;
  const currentPage = isDaoOverviewPage
    ? "/"
    : (enabledOptions.find((o) => pathname?.includes(`/${o.page}`))?.page ??
      "/");

  const handleChange = (value: string) => {
    if (value === "/") {
      router.push(`/${daoId}`);
    } else {
      router.push(`/${daoId}/${value}`);
    }
  };

  return (
    <div className="w-full px-4 py-2">
      <Select
        items={items}
        value={currentPage}
        onValueChange={handleChange}
        placeholder="Navigate to…"
      />
    </div>
  );
};
