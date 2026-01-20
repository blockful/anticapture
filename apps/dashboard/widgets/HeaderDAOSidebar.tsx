"use client";

import { usePathname } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  HeaderDAOSidebarDropdown,
  ButtonHeaderSidebar,
} from "@/shared/components";
import { BarChart, Gauge, Landmark, UserCheck } from "lucide-react";
import daoConfigByDaoId from "@/shared/dao-config";
import { ArrowRightLeft, PieChart } from "lucide-react";
import { Crosshair2Icon } from "@radix-ui/react-icons";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
export const HeaderDAOSidebar = () => {
  const pathname = usePathname();

  const isDefault = pathname === "/";
  const daoId = isDefault ? null : pathname.split("/")[1]?.toUpperCase();
  const daoConfig = daoConfigByDaoId[daoId as DaoIdEnum];

  if (!daoConfig || daoConfig.disableDaoPage) {
    return null;
  }

  return (
    <aside className="bg-surface-background relative z-50 h-screen w-[258px] lg:block">
      <div className="z-50 flex h-full w-full flex-col">
        <HeaderDAOSidebarDropdown />
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col gap-[12px] p-2">
            {daoConfig.daoOverview && (
              <ButtonHeaderSidebar
                page={PAGES_CONSTANTS.daoOverview.page}
                icon={PieChart}
                label={PAGES_CONSTANTS.daoOverview.title}
                key={PAGES_CONSTANTS.daoOverview.title}
              />
            )}
            {daoConfig.attackProfitability && (
              <ButtonHeaderSidebar
                page={PAGES_CONSTANTS.attackProfitability.page}
                icon={Crosshair2Icon}
                label={PAGES_CONSTANTS.attackProfitability.title}
                key={PAGES_CONSTANTS.attackProfitability.title}
              />
            )}
            {daoConfig.riskAnalysis && (
              <ButtonHeaderSidebar
                page={PAGES_CONSTANTS.riskAnalysis.page}
                icon={Gauge}
                label={PAGES_CONSTANTS.riskAnalysis.title}
                key={PAGES_CONSTANTS.riskAnalysis.title}
              />
            )}
            {daoConfig.resilienceStages && (
              <ButtonHeaderSidebar
                page={PAGES_CONSTANTS.resilienceStages.page}
                icon={BarChart}
                label={PAGES_CONSTANTS.resilienceStages.title}
                key={PAGES_CONSTANTS.resilienceStages.title}
              />
            )}
            {daoConfig.tokenDistribution && (
              <ButtonHeaderSidebar
                page={PAGES_CONSTANTS.tokenDistribution.page}
                icon={ArrowRightLeft}
                label={PAGES_CONSTANTS.tokenDistribution.title}
                key={PAGES_CONSTANTS.tokenDistribution.title}
              />
            )}
            {daoConfig.dataTables && (
              <ButtonHeaderSidebar
                page={PAGES_CONSTANTS.holdersAndDelegates.page}
                icon={UserCheck}
                label={PAGES_CONSTANTS.holdersAndDelegates.title}
                key={PAGES_CONSTANTS.holdersAndDelegates.title}
              />
            )}

            {daoConfig.governancePage && (
              <ButtonHeaderSidebar
                page={"governance"}
                icon={Landmark}
                label="Governance"
                key="Governance"
              />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
