"use client";

import { Suspense } from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoAvatarIcon } from "@/shared/components/icons";
import { DaoOverviewSkeleton } from "@/features/dao-overview/skeleton/DaoOverviewSkeleton";
import { useDaoOverviewData } from "@/features/dao-overview/hooks/useDaoOverviewData";
import { DaoOverviewHeader } from "@/features/dao-overview/components/DaoOverviewHeader";
import { DaoOverviewMetrics } from "@/features/dao-overview/components/DaoOverviewMetrics";
import { DaoOverviewHeaderBackground } from "@/features/dao-overview/components/DaoOverviewHeaderBackground";
import { formatEther } from "viem";
import { formatNumberUserReadable } from "@/shared/utils";
import { DaoOverviewResilienceStage } from "@/features/dao-overview/components/DaoOverviewResilienceStage";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";

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
        <div className="border-x-1 border-inverted relative z-10 mx-5 flex gap-2">
          <DaoOverviewResilienceStage daoId={daoId} />
        </div>
      </div>
    </Suspense>
  );
};
