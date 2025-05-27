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
import { GovernanceActivitySection } from "@/features/governance-activity";
import { DaoOverviewSection } from "@/features/dao-overview";
import { TokenDistributionSection } from "@/features/token-distribution";
import BannerAlert from "@/shared/components/design-system/alerts/banner-alert/BannerAlert";
import { Send } from "lucide-react";
import { ANTICAPTURE_TELEGRAM_BOT } from "@/shared/constants/social-media";

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
    <DaoPageInteractionProvider>
      <div className="flex w-full flex-col items-center py-4 sm:gap-2 sm:p-3">
        <BannerAlert
          icon={<Send className="hidden size-4 text-white sm:block" />}
          text={bannerAlertMessage}
          link={{
            url: ANTICAPTURE_TELEGRAM_BOT,
            text: "JOIN OUR TELEGRAM BOT",
          }}
          storageKey={`banner-dismissed-${daoIdEnum}`}
        />

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
        {daoConstants.governanceActivity && <GovernanceActivitySection />}
      </div>
      <ShowYourSupportStickyBar />
    </DaoPageInteractionProvider>
  );
};
