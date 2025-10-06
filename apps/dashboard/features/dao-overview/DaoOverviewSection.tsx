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

const daoColorsSchema = {
  [DaoIdEnum.UNISWAP]: "#fc72ff",
  [DaoIdEnum.ENS]: "#0080bc",
  [DaoIdEnum.ARBITRUM]: "#2d384b",
  [DaoIdEnum.OPTIMISM]: "#ff0420",
  [DaoIdEnum.GITCOIN]: "#1e443f",
};

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
      <div className="relative">
        <DaoOverviewHeaderBackground color={daoColorsSchema[daoId]} />
        <div className="relative z-10 flex flex-col gap-4 px-5 pt-5">
          <div className="border-inverted bg-inverted flex gap-1 border-2">
            <div className="flex max-w-32 items-center justify-center">
              <DaoAvatarIcon daoId={daoId} className="w-full rounded-none" />
            </div>
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
      </div>
    </Suspense>
  );
};
