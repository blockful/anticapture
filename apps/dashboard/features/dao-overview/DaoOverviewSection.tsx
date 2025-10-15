"use client";

import { Suspense } from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoAvatarIcon } from "@/shared/components/icons";
import { DaoOverviewSkeleton } from "@/features/dao-overview/skeleton/DaoOverviewSkeleton";
import { useDaoOverviewData } from "@/features/dao-overview/hooks/useDaoOverviewData";
import { DaoOverviewHeader } from "@/features/dao-overview/components/DaoOverviewHeader";
import { DaoOverviewMetrics } from "@/features/dao-overview/components/DaoOverviewMetrics";
import { TokenDistributionChartCard } from "@/features/dao-overview/components/TokenDistributionChartCard";
import { DaoOverviewHeaderBackground } from "@/features/dao-overview/components/DaoOverviewHeaderBackground";
import { formatEther } from "viem";
import { formatNumberUserReadable } from "@/shared/utils";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { StagesContainer } from "@/features/resilience-stages/components/StagesContainer";
import {
  fieldsToArray,
  getDaoStageFromFields,
} from "@/shared/dao-config/utils";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";
import { RiskAreaCardEnum, RiskAreaCardWrapper } from "@/shared/components";
import { AttackProfitabilityChartCard } from "@/features/dao-overview/components/AttackProfitabilityChartCard";

export const DaoOverviewSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const daoConfig = daoConfigByDaoId[daoId];
  const daoOverview = daoConfig.daoOverview;

  const {
    isLoading,
    lastPrice,
    delegatedSupply,
    activeSupply,
    averageTurnout,
    liquidTreasuryAllValue,
    liquidTreasuryNonDaoValue,
    liquidTreasuryAllPercent,
    averageTurnoutPercentAboveQuorum,
    topDelegatesToPass,
  } = useDaoOverviewData(daoId);

  if (isLoading) return <DaoOverviewSkeleton />;

  const delegatedSupplyValue = formatNumberUserReadable(
    Number(
      formatEther(BigInt(delegatedSupply.data?.currentDelegatedSupply || 0)),
    ),
  );
  const activeSupplyValue = formatNumberUserReadable(
    Number(formatEther(BigInt(activeSupply.data?.activeSupply || 0))),
  );
  const averageTurnoutValue = formatNumberUserReadable(
    Number(
      formatEther(BigInt(averageTurnout.data?.currentAverageTurnout || 0)),
    ),
  );

  const currentDaoStage = getDaoStageFromFields({
    fields: fieldsToArray(daoConfig.governanceImplementation?.fields),
    noStage: daoConfig.noStage,
  });

  const daoRiskAreas = getDaoRiskAreas(daoId);
  const riskAreas = {
    title: "RISK AREAS",
    risks: Object.entries(daoRiskAreas).map(([name, info]) => ({
      name,
      level: info.riskLevel,
    })),
  };

  return (
    <Suspense fallback={<DaoOverviewSkeleton />}>
      <div className="relative flex flex-col gap-5 md:gap-2">
        <DaoOverviewHeaderBackground
          color={daoConfig.color.svgColor}
          bgColor={daoConfig.color.svgBgColor}
        />
        <div className="relative z-10 mx-5 flex flex-col gap-4 pt-5">
          <div className="border-inverted md:bg-inverted flex flex-col gap-1 md:flex-row md:border-2">
            <DaoAvatarIcon
              daoId={daoId}
              className="border-inverted size-32 flex-shrink-0 rounded-none border-2 md:border-none"
            />
            <div className="flex flex-1 flex-col">
              <DaoOverviewHeader
                daoId={daoId}
                daoConfig={daoConfig}
                daoOverview={daoOverview}
                lastPrice={lastPrice}
              />
              <DaoOverviewMetrics
                daoId={daoId}
                delegatedSupplyValue={delegatedSupplyValue}
                activeSupplyValue={activeSupplyValue}
                averageTurnoutValue={averageTurnoutValue}
                averageTurnoutPercentAboveQuorum={
                  averageTurnoutPercentAboveQuorum
                }
                liquidTreasuryAllValue={liquidTreasuryAllValue}
                liquidTreasuryAllPercent={liquidTreasuryAllPercent}
                liquidTreasuryNonDaoValue={liquidTreasuryNonDaoValue}
                topDelegatesToPass={topDelegatesToPass}
              />
            </div>
          </div>
        </div>
        <div className="block md:hidden">
          <DividerDefault isHorizontal />
        </div>
        <div className="border-x-1 border-inverted grid grid-cols-1 gap-5 md:mx-5 md:grid-cols-2 md:gap-2">
          <div className="w-full px-5 md:px-0">
            <StagesContainer
              daoId={daoId}
              currentDaoStage={currentDaoStage}
              daoConfig={daoConfig}
              context="overview"
            />
          </div>
          <div className="block md:hidden">
            <DividerDefault isHorizontal />
          </div>
          <RiskAreaCardWrapper
            title={riskAreas.title}
            riskAreas={riskAreas.risks}
            onRiskClick={() => {}}
            variant={RiskAreaCardEnum.DAO_OVERVIEW}
            className="grid h-full grid-cols-2 gap-2 px-5 md:px-0"
          />
          <div className="block md:hidden">
            <DividerDefault isHorizontal />
          </div>
          <AttackProfitabilityChartCard daoId={daoId} />
          <div className="block md:hidden">
            <DividerDefault isHorizontal />
          </div>
          <TokenDistributionChartCard daoId={daoId} />
        </div>
      </div>
    </Suspense>
  );
};
