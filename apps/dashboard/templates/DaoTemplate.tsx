"use client";

import { ShowYourSupportStickyBar } from "@/features/show-support/components";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoPageInteractionProvider } from "@/shared/contexts/DaoPageInteractionContext";
import { ShowSupportSection } from "@/features/show-support";
import { AttackProfitabilitySection } from "@/features/attack-profitability";
import { RiskAnalysisSection } from "@/features/risk-analysis";
import { GovernanceImplementationSection } from "@/features/governance-implementation";
import { ResilienceStagesSection } from "@/features/resilience-stages";
import { DaoOverviewSection } from "@/features/dao-overview";
import { TokenDistributionSection } from "@/features/token-distribution";
import { HoldersAndDelegatesSection } from "@/features/holders-and-delegates";

// import { BannerAlert } from "@/shared/components/design-system/alerts/banner-alert/BannerAlert";
// import { Info, Send } from "lucide-react";
// import { ANTICAPTURE_TELEGRAM_BOT } from "@/shared/constants/social-media";

export const DaoTemplate = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];
  const { disableDaoPage } = daoConstants;
  if (disableDaoPage) {
    return null;
  }

  // const bannerAlertMessage =
  //   "RECEIVE REAL-TIME " +
  //   daoConstants.name.toUpperCase() +
  //   " SECURITY UPDATES.";

  return (
    <DaoPageInteractionProvider>
      {/* <MessageStacker messages={messages} /> */}
      {/* <BannerAlert
          icon={<Info className="size-4" />}
          text={"Currently in beta. Some data inconsistencies may occur."}
          storageKey={`beta-banner-dismissed-${daoIdEnum}`}
        /> */}
      <div className="flex w-full flex-col items-center py-4 sm:gap-2 sm:p-3">
        {/* Commented out while TelegramBot is not ready to be added to the DAO */}
        {/* <BannerAlert
          icon={<Send className="hidden size-4 text-white sm:block" />}
          text={bannerAlertMessage}
          link={{
            url: ANTICAPTURE_TELEGRAM_BOT,
            text: "JOIN OUR TELEGRAM BOT",
          }}
          storageKey={`banner-dismissed-${daoIdEnum}`}
        />
        <BannerAlert
          icon={<Info className="hidden size-4 text-white sm:block" />}
          text={bannerAlertMessage}
          storageKey={`banner-dismissed-${daoIdEnum}`}
          variant="highlight"
        /> */}

        {daoConstants.daoOverview && <DaoOverviewSection daoId={daoIdEnum} />}

        {daoConstants.showSupport && <ShowSupportSection daoId={daoIdEnum} />}

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

        {daoConstants.tokenDistribution && <TokenDistributionSection />}
        <HoldersAndDelegatesSection daoId={daoIdEnum} />
      </div>
      <ShowYourSupportStickyBar />
    </DaoPageInteractionProvider>
  );
};
