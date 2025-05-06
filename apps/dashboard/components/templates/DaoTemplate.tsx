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
import { Stage } from "@/components/atoms";
// import { TelegramBotMessage } from "@/components/atoms";

export const DaoTemplate = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];
  const { disableDaoPage } = daoConstants;
  if (disableDaoPage) {
    return null;
  }

  const messages: Message[] = [
    // {
    //   id: "telegram-bot",
    //   content: <TelegramBotMessage />,
    // },
  ];

  return (
    <>
      <div className="w-full gap-2 sm:py-3">
        <MessageStacker messages={messages} />
      </div>
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
        <ResilienceStagesSection
          currentDaoStage={Stage.ZERO}
          daoId={daoIdEnum}
        />
      )}
      {daoConstants.tokenDistribution && <TokenDistributionSection />}
      {daoConstants.governanceActivity && <GovernanceActivitySection />}
      <ShowYourSupportStickyBar />
    </>
  );
};
