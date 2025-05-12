"use client";

import {
  // TelegramBotMessage,
  ShowYourSupportStickyBar,
} from "@/components/atoms";
// import { Message, MessageStacker } from "@/components/molecules";
import {
  DaoOverviewSection,
  GovernanceActivitySection,
  ResilienceStagesSection,
  TokenDistributionSection,
} from "@/components/organisms";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import daoConfigByDaoId from "@/lib/dao-config";
import { DaoPageInteractionProvider } from "@/contexts/DaoPageInteractionContext";
import { ShowSupportSection } from "@/features/show-support";
import { AttackProfitabilitySection } from "@/features/attack-profitability";
import { RiskAnalysisSection } from "@/features/risk-analysis";
import { GovernanceImplementationSection } from "@/features/governance-implementation";
export const DaoTemplate = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];
  const { disableDaoPage } = daoConstants;
  if (disableDaoPage) {
    return null;
  }

  /**
   * Commented out because the telegram are not implemented yet
  const messages: Message[] = [
    {
      id: "telegram-bot",
      content: <TelegramBotMessage />,
    },
  ];
  */

  return (
    <DaoPageInteractionProvider>
      {/* <MessageStacker messages={messages} /> */}
      <div className="flex w-full flex-col items-center gap-5 px-3 py-4 sm:gap-6 sm:p-3">
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
