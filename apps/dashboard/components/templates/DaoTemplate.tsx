"use client";

import {
  AttackProfitabilitySection,
  DaoOverviewSection,
  GovernanceActivitySection,
  GovernanceImplementationSection,
  RiskAnalysisSection,
  ResilienceStagesSection,
  ShowSupportSection,
  TokenDistributionSection,
} from "@/components/organisms";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import daoConfigByDaoId from "@/lib/dao-config";
import { ShowYourSupportStickyBar } from "@/components/atoms/ShowYourSupportStickyBar";
import { Message, MessageStacker } from "@/components/molecules";
import { Stage, TelegramBotMessage } from "@/components/atoms";
import { DaoPageInteractionProvider } from "@/contexts/DaoPageInteractionContext";

export const DaoTemplate = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];
  const { disableDaoPage } = daoConstants;
  if (disableDaoPage) {
    return null;
  }

  const messages: Message[] = [
    {
      id: "telegram-bot",
      content: <TelegramBotMessage />,
    },
  ];

  return (
    <DaoPageInteractionProvider>
      <div className="w-full gap-2 px-4 pt-4 sm:px-3 sm:py-2">
        <MessageStacker messages={messages} />
      </div>
      <div className="flex w-full flex-col items-center pt-0 sm:gap-6 sm:px-3 sm:pb-3">
        {daoConstants.daoOverview && <DaoOverviewSection daoId={daoIdEnum} />}
        {daoConstants.showSupport && <ShowSupportSection />}
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
          <ResilienceStagesSection
            currentDaoStage={Stage.ZERO}
            daoId={daoIdEnum}
          />
        )}
        {daoConstants.tokenDistribution && <TokenDistributionSection />}
        {daoConstants.governanceActivity && <GovernanceActivitySection />}
      </div>
      <ShowYourSupportStickyBar />
    </DaoPageInteractionProvider>
  );
};
