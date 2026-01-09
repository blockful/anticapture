"use client";

import { Suspense, useEffect } from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoAvatarIcon } from "@/shared/components/icons";
import { DaoOverviewSkeleton } from "@/features/dao-overview/skeleton/DaoOverviewSkeleton";
import { DaoOverviewHeaderMetrics } from "@/features/dao-overview/components/DaoOverviewHeaderMetrics";
import { TokenDistributionChartCard } from "@/features/dao-overview/components/TokenDistributionChartCard";
import { DaoOverviewHeaderBackground } from "@/features/dao-overview/components/DaoOverviewHeaderBackground";
import { SecurityCouncilCard } from "@/features/dao-overview/components/SecurityCouncilCard";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { StagesContainer } from "@/features/resilience-stages/components/StagesContainer";
import {
  fieldsToArray,
  getDaoStageFromFields,
} from "@/shared/dao-config/utils";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";
import { RiskAreaCardEnum, RiskAreaCardWrapper } from "@/shared/components";
import { AccountBalanceChartCard } from "@/features/dao-overview/components/AccountBalanceChartCard";
import { VotingPowerChartCard } from "@/features/dao-overview/components/VotingPowerChartCard";
import { MetricsCard } from "@/features/dao-overview/components/MetricsCard";
import { AttackProfitabilityChartCard } from "@/features/dao-overview/components/AttackProfitabilityChartCard";
import { useRouter } from "next/navigation";
import { apolloClient } from "@/shared/providers/GlobalProviders";

export const DaoOverviewSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const router = useRouter();
  const daoConfig = daoConfigByDaoId[daoId];
  const daoOverview = daoConfig.daoOverview;

  useEffect(() => {
    // FIXME:
    //   This is only a workaround for now, as Apollo Client does not yet support HTTP header context for cache indexing;
    //   https://github.com/apollographql/apollo-feature-requests/issues/326
    apolloClient.cache.reset();
  }, [daoId]);

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
              className="border-inverted size-32 shrink-0 rounded-none border-2 md:border-none"
            />

            <DaoOverviewHeaderMetrics daoId={daoId} daoConfig={daoConfig} />
          </div>
        </div>
        <div className="block md:hidden">
          <DividerDefault isHorizontal />
        </div>
        <div className="border-inverted grid grid-cols-1 gap-5 border-x md:mx-5 md:grid-cols-2 md:gap-2">
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
            onRiskClick={() => {
              router.push(`/${daoId.toLowerCase()}/risk-analysis`);
            }}
            variant={RiskAreaCardEnum.DAO_OVERVIEW}
            className="grid h-full grid-cols-2 gap-2 px-5 md:px-0"
          />
          <div className="block md:hidden">
            <DividerDefault isHorizontal />
          </div>
        </div>
        <div className="border-inverted mx-5 border-x">
          <MetricsCard daoId={daoId} daoConfig={daoConfig} />
        </div>
        <div className="block md:hidden">
          <DividerDefault isHorizontal />
        </div>
        <SecurityCouncilCard daoOverview={daoOverview} />
        <div className="border-inverted grid grid-cols-1 gap-5 border-x md:mx-5 md:grid-cols-2 md:gap-2">
          <AttackProfitabilityChartCard daoId={daoId} />
          <div className="block md:hidden">
            <DividerDefault isHorizontal />
          </div>
          <TokenDistributionChartCard daoId={daoId} />
        </div>
        <div className="block md:hidden">
          <DividerDefault isHorizontal />
        </div>
        <div className="border-inverted grid grid-cols-1 gap-5 border-x md:mx-5 md:grid-cols-2 md:gap-2">
          <div className="w-full">
            <AccountBalanceChartCard daoId={daoId} />
          </div>
          <div className="block md:hidden">
            <DividerDefault isHorizontal />
          </div>
          <div className="w-full">
            <VotingPowerChartCard daoId={daoId} />
          </div>
        </div>
      </div>
    </Suspense>
  );
};
