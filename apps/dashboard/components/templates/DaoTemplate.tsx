"use client";

import {
  Stage,
  TelegramBotMessage,
  ShowYourSupportStickyBar,
} from "@/components/atoms";
import { Message, MessageStacker } from "@/components/molecules";
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
      <MessageStacker messages={messages} />
      <div className="flex w-full flex-col items-center pt-0 sm:gap-6 sm:p-3">
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
          <ResilienceStagesSection daoId={daoIdEnum} />
        )}
        {daoConstants.tokenDistribution && <TokenDistributionSection />}
        {daoConstants.governanceActivity && <GovernanceActivitySection />}
      </div>
      <ShowYourSupportStickyBar />
    </DaoPageInteractionProvider>
  );
};
