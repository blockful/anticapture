"use client";

import { usePathname } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  HeaderDAOSidebarDropdown,
  ButtonHeaderSidebar,
} from "@/shared/components";
import { BarChart, Gauge, HeartIcon, UserCheck } from "lucide-react";
import daoConfigByDaoId from "@/shared/dao-config";
import { ArrowRightLeft, PieChart } from "lucide-react";
import { Crosshair2Icon } from "@radix-ui/react-icons";
export const HeaderDAOSidebar = () => {
  const pathname = usePathname();

  const isDefault = pathname === "/";
  const daoId = isDefault ? null : pathname.split("/")[1]?.toUpperCase();
  const daoConfig = daoConfigByDaoId[daoId as DaoIdEnum];

  if (daoConfig.disableDaoPage) {
    return null;
  }

  return (
    <aside
      className={`border-light-dark bg-surface-background fixed left-[68px] top-0 z-50 hidden h-screen w-[258px] border-r sm:block`}
    >
      <div className="flex h-full w-full flex-col">
        <HeaderDAOSidebarDropdown />
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col gap-3 p-4">
            {daoConfig.daoOverview && (
              <ButtonHeaderSidebar
                page="dao-overview"
                icon={PieChart}
                label="DAO Overview"
              />
            )}
            {daoConfig.showSupport && (
              <ButtonHeaderSidebar
                page="show-support"
                icon={HeartIcon}
                label="Show Support"
              />
            )}
            {daoConfig.attackProfitability && (
              <ButtonHeaderSidebar
                page="attack-profitability"
                icon={Crosshair2Icon}
                label="Attack Profitability"
              />
            )}
            {daoConfig.riskAnalysis && (
              <ButtonHeaderSidebar
                page="risk-analysis"
                icon={Gauge}
                label="Risk Analysis"
              />
            )}
            {/* {daoConfig.governanceImplementation && (
              <ButtonHeaderSidebar
                page="governance-implementation"
                icon={Lightbulb}
                label="Gov Implementation"
              />
            )} */}
            {daoConfig.resilienceStages && (
              <ButtonHeaderSidebar
                page="resilience-stages"
                icon={BarChart}
                label="Resilience Stages"
              />
            )}
            {daoConfig.tokenDistribution && (
              <ButtonHeaderSidebar
                page="token-distribution"
                icon={ArrowRightLeft}
                label="Token Distribution"
              />
            )}
            {daoConfig.dataTables && (
              <ButtonHeaderSidebar
                page="holders-and-delegates"
                icon={UserCheck}
                label="Holders & Delegates"
              />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
