import { useMemo } from "react";

import { DaoOverviewHeader } from "@/features/dao-overview/components/DaoOverviewHeader";
import { DaoOverviewMetricCard } from "@/features/dao-overview/components/DaoOverviewMetricCard";
import { useDaoOverviewData } from "@/features/dao-overview/hooks/useDaoOverviewData";
import { BadgeStatus, TooltipInfo } from "@/shared/components";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { useQuorumGap } from "@/shared/hooks/useQuorumGap";
import { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";

interface DaoOverviewHeaderMetricsProps {
  daoId: string;
  daoConfig: DaoConfiguration;
  reviewStage?: boolean;
}

const TREASURY_TOOLTIPS = {
  MULTISIG_FULL:
    "The DAO treasury is managed via a multisig and does not have a single on-chain treasury contract. As a result, treasury-based risk and attack metrics are not applicable.",
  MULTISIG_SHORT:
    "The DAO treasury is managed via a multisig. As a result, treasury-based risk and attack metrics are not applicable.",
} as const;

const DELEGATE_TO_PASS_TOOLTIP =
  "Shows how many top delegates would be needed to reach the required votes to pass a proposal.";

const DelegateToPassTitle = () => (
  <Tooltip
    tooltipContent={
      <div className="text-center">
        <p>{DELEGATE_TO_PASS_TOOLTIP}</p>
      </div>
    }
  >
    <p className="text-secondary font-mono text-xs font-medium uppercase tracking-wider">
      Delegate to Pass
    </p>
  </Tooltip>
);

const getQuorumGapText = (quorumGap: number | null | undefined): string => {
  if (quorumGap == null || isNaN(quorumGap)) {
    return "No recent proposals";
  }

  if (quorumGap === 0) {
    return "equal to quorum";
  }

  const direction = quorumGap < 0 ? "below" : "above";
  return `${Math.abs(quorumGap).toFixed(2)}% ${direction} quorum`;
};

const getTreasuryMetrics = (
  daoId: string,
  isLoading: boolean,
  liquidTreasuryAllValueFormatted: string,
  liquidTreasuryAllPercent: number,
  liquidTreasuryNonDaoValueFormatted: string,
  reviewStage?: boolean,
) => {
  // if (daoId === DaoIdEnum.OPTIMISM) {
  //   return (
  //     <DaoOverviewMetricCard
  //       title="Treasury"
  //       text={
  //         <p className="flex items-center gap-1.5">
  //           Multisig Governed{" "}
  //           <TooltipInfo text={TREASURY_TOOLTIPS.MULTISIG_FULL} />
  //         </p>
  //       }
  //       subText="Not on-chain identifiable"
  //       isLoading={isLoading}
  //     />
  //   );
  // }

  if (daoId === DaoIdEnum.OBOL) {
    return (
      <DaoOverviewMetricCard
        title="Treasury"
        text={
          <p className="flex items-center gap-1.5">
            {`$${liquidTreasuryAllValueFormatted}`}
            <TooltipInfo text={TREASURY_TOOLTIPS.MULTISIG_SHORT} />
          </p>
        }
        subText="Multisig-governed"
        isLoading={isLoading}
      />
    );
  }

  return (
    <DaoOverviewMetricCard
      title="Treasury"
      text={
        reviewStage ? (
          <BadgeStatus variant={"dimmed"} className="w-fit rounded">
            Review needed
          </BadgeStatus>
        ) : (
          `$${liquidTreasuryAllValueFormatted} (${liquidTreasuryAllPercent}% in ${daoId})`
        )
      }
      subText={
        liquidTreasuryNonDaoValueFormatted !== "0" && !reviewStage
          ? `$${liquidTreasuryNonDaoValueFormatted} not counting ${daoId}`
          : undefined
      }
      isLoading={isLoading}
    />
  );
};

const getDelegatesToPass = (
  daoId: string,
  topDelegatesToPass: number | null,
  isLoading: boolean,
  reviewStage: boolean,
) => {
  // if (daoId === DaoIdEnum.OPTIMISM) {
  //   return (
  //     <DaoOverviewMetricCard
  //       title={<DelegateToPassTitle />}
  //       text="Varies per proposal"
  //       subText="Depends on active delegation"
  //       isLoading={isLoading}
  //     />
  //   );
  // }

  return (
    <DaoOverviewMetricCard
      title={<DelegateToPassTitle />}
      text={
        reviewStage ? (
          <BadgeStatus variant={"dimmed"} className="w-fit rounded">
            <span className="w-full text-center">Review needed</span>
          </BadgeStatus>
        ) : (
          `Top ${topDelegatesToPass || "N/A"} delegates`
        )
      }
      subText={!reviewStage && "To reach quorum"}
      isLoading={isLoading}
    />
  );
};

export const DaoOverviewHeaderMetrics = ({
  daoId,
  daoConfig,
  reviewStage,
}: DaoOverviewHeaderMetricsProps) => {
  const {
    treasuryStats,
    delegatedSupply,
    activeSupply,
    averageTurnout,
    topDelegatesToPass,
    isLoading,
  } = useDaoOverviewData({ daoId: daoId as DaoIdEnum, daoConfig });

  const { data: quorumGap } = useQuorumGap(daoId as DaoIdEnum);

  const {
    liquidTreasuryAllValue,
    liquidTreasuryAllPercent,
    liquidTreasuryNonDaoValue,
    lastPrice,
  } = treasuryStats;

  const formattedValues = useMemo(
    () => ({
      delegatedSupply: formatNumberUserReadable(delegatedSupply),
      activeSupply: formatNumberUserReadable(activeSupply),
      averageTurnout: formatNumberUserReadable(averageTurnout),
      liquidTreasuryAll: formatNumberUserReadable(liquidTreasuryAllValue),
      liquidTreasuryNonDao: formatNumberUserReadable(liquidTreasuryNonDaoValue),
    }),
    [
      delegatedSupply,
      activeSupply,
      averageTurnout,
      liquidTreasuryAllValue,
      liquidTreasuryNonDaoValue,
    ],
  );

  const quorumGapText = getQuorumGapText(quorumGap);

  const treasuryMetrics = getTreasuryMetrics(
    daoId,
    isLoading,
    formattedValues.liquidTreasuryAll,
    Number(liquidTreasuryAllPercent),
    formattedValues.liquidTreasuryNonDao,
    !!reviewStage,
  );

  const delegatesToPass = getDelegatesToPass(
    daoId,
    Number(topDelegatesToPass),
    isLoading,
    !!reviewStage,
  );

  return (
    <div className="flex flex-1 flex-col">
      <DaoOverviewHeader
        daoId={daoId}
        daoConfig={daoConfig}
        daoOverview={daoConfig.daoOverview}
        lastPrice={lastPrice}
        isLoading={isLoading}
      />
      <div className="border-t-border-default lg:bg-surface-default grid grid-cols-2 gap-4 border-t border-dashed pt-4 lg:grid-cols-4 lg:gap-0.5 lg:border-none lg:pt-0">
        <DaoOverviewMetricCard
          title="Votable Supply"
          text={
            reviewStage ? (
              <BadgeStatus variant={"dimmed"} className="w-fit rounded">
                <span className="w-full text-center">Review needed</span>
              </BadgeStatus>
            ) : (
              `${formattedValues.delegatedSupply} ${daoId} delegated`
            )
          }
          subText={
            !reviewStage &&
            `${formattedValues.activeSupply} ${daoId} active in last 90d`
          }
          isLoading={isLoading}
        />
        {treasuryMetrics}
        <DaoOverviewMetricCard
          title="Average Turnout"
          text={
            reviewStage ? (
              <BadgeStatus variant={"dimmed"} className="w-fit rounded">
                <span className="w-full text-center">Review needed</span>
              </BadgeStatus>
            ) : (
              `${formattedValues.averageTurnout} ${daoId}`
            )
          }
          subText={!reviewStage && quorumGapText}
          isLoading={isLoading}
        />
        {delegatesToPass}
      </div>
    </div>
  );
};
