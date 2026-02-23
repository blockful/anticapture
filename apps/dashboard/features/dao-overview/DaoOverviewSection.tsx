"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

import { AccountBalanceChartCard } from "@/features/dao-overview/components/AccountBalanceChartCard";
import { AttackProfitabilityChartCard } from "@/features/dao-overview/components/AttackProfitabilityChartCard";
import { DaoOverviewHeaderBackground } from "@/features/dao-overview/components/DaoOverviewHeaderBackground";
import { DaoOverviewHeaderMetrics } from "@/features/dao-overview/components/DaoOverviewHeaderMetrics";
import { LastProposalsCard } from "@/features/dao-overview/components/LastProposalsCard";
import { MetricsCard } from "@/features/dao-overview/components/MetricsCard";
import { OngoingProposalBanner } from "@/features/dao-overview/components/OngoingProposalBanner";
import { SecurityCouncilCard } from "@/features/dao-overview/components/SecurityCouncilCard";
import { TokenDistributionChartCard } from "@/features/dao-overview/components/TokenDistributionChartCard";
import { VotingPowerChartCard } from "@/features/dao-overview/components/VotingPowerChartCard";
import { DaoOverviewSkeleton } from "@/features/dao-overview/skeleton/DaoOverviewSkeleton";
import { StagesContainer } from "@/features/resilience-stages/components/StagesContainer";
import { RiskAreaCardEnum, RiskAreaCardWrapper } from "@/shared/components";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { DaoAvatarIcon } from "@/shared/components/icons";
import daoConfigByDaoId from "@/shared/dao-config";
import {
  fieldsToArray,
  getDaoStageFromFields,
} from "@/shared/dao-config/utils";
import { apolloClient } from "@/shared/providers/GlobalProviders";
import { DaoIdEnum } from "@/shared/types/daos";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";

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
    title: "Attack Exposure",
    risks: Object.entries(daoRiskAreas).map(([name, info]) => ({
      name,
      level: info.riskLevel,
    })),
  };

  return (
    <Suspense fallback={<DaoOverviewSkeleton />}>
      <div className="relative flex flex-col gap-5 lg:gap-2">
        <DaoOverviewHeaderBackground
          color={daoConfig.color.svgColor}
          bgColor={daoConfig.color.svgBgColor}
        />
        <div className="relative z-10 mx-5 flex flex-col gap-4 pt-5">
          <div className="border-inverted lg:bg-inverted flex flex-col gap-1 lg:flex-row lg:border-2">
            <DaoAvatarIcon
              daoId={daoId}
              className="border-inverted size-32 shrink-0 rounded-none border-2 lg:border-none"
            />

            <DaoOverviewHeaderMetrics daoId={daoId} daoConfig={daoConfig} />
          </div>
        </div>
        <div className="block lg:hidden">
          <DividerDefault isHorizontal />
        </div>

        {daoConfig.governancePage && (
          <div className="mx-5">
            <OngoingProposalBanner daoId={daoId} />
          </div>
        )}

        <div className="border-inverted grid grid-cols-1 gap-5 border-x lg:mx-5 lg:grid-cols-2 lg:gap-2">
          <div className="w-full px-5 lg:px-0">
            <StagesContainer
              daoId={daoId}
              currentDaoStage={currentDaoStage}
              daoConfig={daoConfig}
              context="overview"
            />
          </div>
          <div className="block lg:hidden">
            <DividerDefault isHorizontal />
          </div>
          <RiskAreaCardWrapper
            daoId={daoId}
            title={riskAreas.title}
            riskAreas={riskAreas.risks}
            onRiskClick={() => {
              router.push(`/${daoId.toLowerCase()}/risk-analysis`);
            }}
            variant={RiskAreaCardEnum.DAO_OVERVIEW}
            className="grid h-full grid-cols-2 gap-2 px-5 lg:px-0"
          />
          <div className="block lg:hidden">
            <DividerDefault isHorizontal />
          </div>
        </div>
        <div className="border-inverted mx-5 border-x">
          <MetricsCard daoId={daoId} daoConfig={daoConfig} />
        </div>
        <div className="block lg:hidden">
          <DividerDefault isHorizontal />
        </div>
        <SecurityCouncilCard daoOverview={daoOverview} />
        <div className="border-inverted grid grid-cols-1 gap-5 border-x lg:mx-5 lg:grid-cols-2 lg:gap-2">
          <AttackProfitabilityChartCard daoId={daoId} />
          <div className="block lg:hidden">
            <DividerDefault isHorizontal />
          </div>
          <TokenDistributionChartCard daoId={daoId} />
        </div>
        <div className="block lg:hidden">
          <DividerDefault isHorizontal />
        </div>
        <div className="border-inverted grid grid-cols-1 gap-5 border-x lg:mx-5 lg:grid-cols-2 lg:gap-2">
          <div className="w-full">
            <AccountBalanceChartCard daoId={daoId} />
          </div>
          <div className="block lg:hidden">
            <DividerDefault isHorizontal />
          </div>
          <div className="w-full">
            <VotingPowerChartCard daoId={daoId} />
          </div>
        </div>
        {daoConfig.governancePage && <LastProposalsCard daoId={daoId} />}
      </div>
    </Suspense>
  );
};
