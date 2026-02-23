"use client";

import { Send } from "lucide-react";
import { useParams } from "next/navigation";

import { AttackProfitabilitySection } from "@/features/attack-profitability";
import { DaoOverviewSection } from "@/features/dao-overview";
import { GovernanceImplementationSection } from "@/features/governance-implementation";
import { HoldersAndDelegatesSection } from "@/features/holders-and-delegates";
import { ResilienceStagesSection } from "@/features/resilience-stages";
import { RiskAnalysisSection } from "@/features/risk-analysis";
import { TokenDistributionSection } from "@/features/token-distribution";
import { BannerAlert } from "@/shared/components/design-system/alerts/banner-alert/BannerAlert";
import { ANTICAPTURE_TELEGRAM_BOT } from "@/shared/constants/social-media";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";

export const DaoTemplate = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];
  const { disableDaoPage } = daoConstants;
  if (disableDaoPage) {
    return null;
  }

  const bannerAlertMessage =
    "RECEIVE REAL-TIME " +
    daoConstants.name.toUpperCase() +
    " SECURITY UPDATES.";

  return (
    <>
      {/* <MessageStacker messages={messages} /> */}
      {/* <BannerAlert
        icon={<Info className="size-4" />}
        text={"Currently in beta. Some data inconsistencies may occur."}
        storageKey={`beta-banner-dismissed-${daoIdEnum}`}
      /> */}
      <div className="flex w-full flex-col items-center py-4 lg:gap-2 lg:p-3">
        <BannerAlert
          icon={<Send className="hidden size-4 text-white lg:block" />}
          text={bannerAlertMessage}
          link={{
            url: ANTICAPTURE_TELEGRAM_BOT,
            text: "JOIN OUR TELEGRAM BOT",
          }}
          storageKey={`banner-dismissed-${daoIdEnum}`}
        />
        {/* <BannerAlert
          icon={<Info className="hidden size-4 text-white lg:block" />}
          text={bannerAlertMessage}
          storageKey={`banner-dismissed-${daoIdEnum}`}
          variant="highlight"
        /> */}

        {daoConstants.daoOverview && <DaoOverviewSection daoId={daoIdEnum} />}

        {daoConstants.attackProfitability && (
          <AttackProfitabilitySection
            daoId={daoIdEnum}
            attackProfitability={daoConstants.attackProfitability}
          />
        )}
        {daoConstants.riskAnalysis && <RiskAnalysisSection daoId={daoIdEnum} />}
        {daoConstants.governanceImplementation && (
          <GovernanceImplementationSection daoId={daoIdEnum} />
        )}
        {daoConstants.resilienceStages && (
          <ResilienceStagesSection daoId={daoIdEnum} />
        )}

        {daoConstants.tokenDistribution && (
          <TokenDistributionSection daoId={daoIdEnum} />
        )}
        {daoConstants.dataTables && (
          <HoldersAndDelegatesSection daoId={daoIdEnum} />
        )}
      </div>
    </>
  );
};
