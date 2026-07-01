"use client";

import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { Info } from "lucide-react";

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
import { StagesContainer } from "@/features/resilience-stages/components/StagesContainer";
import {
  RiskAreaCardEnum,
  RiskAreaCardWrapper,
  SkeletonRow,
} from "@/shared/components";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { DaoAvatarIcon } from "@/shared/components/icons";
import daoConfigByDaoId from "@/shared/dao-config";
import { Stage } from "@/shared/types/enums/Stage";
import { BannerAlert } from "@/shared/components/design-system/alerts/banner-alert/BannerAlert";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import {
  fieldsToArray,
  getDaoStageFromFields,
} from "@/shared/dao-config/utils";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";

export const DaoOverviewSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const router = useRouter();
  const daoConfig = daoConfigByDaoId[daoId];
  const daoOverview = daoConfig.daoOverview;

  const currentDaoStage = getDaoStageFromFields({
    fields: fieldsToArray(daoConfig.governanceImplementation?.fields),
    noStage: daoConfig.noStage,
  });

  const daoRiskAreas = getDaoRiskAreas(daoId);
  const hasResilienceOrAttackExposure =
    daoConfig.resilienceStages || daoConfig.attackExposure;
  const riskAreas = {
    title: "Attack Exposure",
    risks: Object.entries(daoRiskAreas).map(([name, info]) => ({
      name,
      level: info.riskLevel,
    })),
  };

  return (
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

          <Suspense fallback={<SkeletonRow className="h-32 w-full" />}>
            <DaoOverviewHeaderMetrics
              daoId={daoId}
              daoConfig={daoConfig}
              reviewStage={currentDaoStage === Stage.UNKNOWN}
            />
          </Suspense>
        </div>
      </div>
      <div className="block lg:hidden">
        <DividerDefault isHorizontal />
      </div>

      {daoConfig.governancePage && (
        <div className="mx-5">
          <Suspense fallback={null}>
            <OngoingProposalBanner daoId={daoId} />
          </Suspense>
        </div>
      )}

      {currentDaoStage === Stage.UNKNOWN && (
        <div className="mx-5">
          <BannerAlert
            icon={<Info className="size-4" />}
            text="This DAO is needing review. Enable monitoring for faster governance risk signals."
            storageKey={`donate-banner-dismissed-${daoId}`}
            links={{
              url: `/donate`,
              text: "Donate",
              openInNewTab: true,
            }}
          />
        </div>
      )}

      {hasResilienceOrAttackExposure && (
        <div className="border-inverted grid grid-cols-1 gap-5 border-x lg:mx-5 lg:grid-cols-2 lg:gap-2">
          <div className="w-full px-5 lg:px-0">
            {daoConfig.resilienceStages ? (
              <Suspense fallback={<SkeletonRow className="h-56 w-full" />}>
                <StagesContainer
                  daoId={daoId}
                  currentDaoStage={currentDaoStage}
                  daoConfig={daoConfig}
                  context="overview"
                />
              </Suspense>
            ) : (
              <BlankSlate
                variant="title"
                icon={Info}
                title="Resilience Stages"
                description="Resilience stages are not available for this DAO."
                className="h-full"
              />
            )}
          </div>
          <div className="block lg:hidden">
            <DividerDefault isHorizontal />
          </div>
          {daoConfig.attackExposure ? (
            <Suspense fallback={<SkeletonRow className="h-56 w-full" />}>
              <RiskAreaCardWrapper
                daoId={daoId}
                title={riskAreas.title}
                riskAreas={riskAreas.risks}
                onRiskClick={() => {
                  router.push(`/${daoId.toLowerCase()}/risk-analysis`);
                }}
                variant={RiskAreaCardEnum.DAO_OVERVIEW}
                className="grid h-full grid-cols-2 gap-2 px-5 lg:px-0"
                currentDaoStage={currentDaoStage}
              />
            </Suspense>
          ) : (
            <BlankSlate
              variant="title"
              icon={Info}
              title="Attack Exposure"
              description="Attack exposure analysis is not available for this DAO."
              className="h-full"
            />
          )}
          <div className="block lg:hidden">
            <DividerDefault isHorizontal />
          </div>
        </div>
      )}
      {currentDaoStage !== Stage.UNKNOWN && (
        <div className="border-inverted mx-5 border-x">
          <Suspense fallback={<SkeletonRow className="h-[90px] w-full" />}>
            <MetricsCard daoId={daoId} daoConfig={daoConfig} />
          </Suspense>
        </div>
      )}
      <div className="block lg:hidden">
        <DividerDefault isHorizontal />
      </div>
      <Suspense fallback={null}>
        <SecurityCouncilCard daoOverview={daoOverview} />
      </Suspense>
      <div className="border-inverted grid grid-cols-1 gap-5 border-x lg:mx-5 lg:grid-cols-2 lg:gap-2">
        <Suspense fallback={<SkeletonRow className="h-56 w-full" />}>
          <AttackProfitabilityChartCard
            daoId={daoId}
            currentDaoStage={currentDaoStage}
          />
        </Suspense>
        <div className="block lg:hidden">
          <DividerDefault isHorizontal />
        </div>
        <Suspense fallback={<SkeletonRow className="h-56 w-full" />}>
          <TokenDistributionChartCard
            daoId={daoId}
            currentDaoStage={currentDaoStage}
          />
        </Suspense>
      </div>
      <div className="block lg:hidden">
        <DividerDefault isHorizontal />
      </div>
      <div className="border-inverted grid grid-cols-1 gap-5 border-x lg:mx-5 lg:grid-cols-2 lg:gap-2">
        <div className="w-full">
          <Suspense fallback={<SkeletonRow className="h-52 w-full" />}>
            <AccountBalanceChartCard daoId={daoId} />
          </Suspense>
        </div>
        <div className="block lg:hidden">
          <DividerDefault isHorizontal />
        </div>
        <div className="w-full">
          <Suspense fallback={<SkeletonRow className="h-52 w-full" />}>
            <VotingPowerChartCard daoId={daoId} />
          </Suspense>
        </div>
      </div>
      {daoConfig.governancePage && (
        <Suspense fallback={<SkeletonRow className="h-56 w-full" />}>
          <LastProposalsCard daoId={daoId} />
        </Suspense>
      )}
    </div>
  );
};
