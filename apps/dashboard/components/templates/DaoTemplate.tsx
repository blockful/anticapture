"use client";

import {
  AttackProfitabilitySection,
  DaoOverviewSection,
  GovernanceActivitySection,
  GovernanceImplementationSection,
  ShowSupportSection,
  TokenDistributionSection,
} from "@/components/organisms";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import daoConfigByDaoId from "@/lib/dao-config";
import { ShowYourSupportStickyBar } from "@/components/atoms/ShowYourSupportStickyBar";
import { Message, MessageStacker } from "@/components/molecules";
import { TelegramBotMessage } from "@/components/atoms";
import { Stage, StageTag } from "../atoms/StageTag";

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
      {daoConstants.showSupport && <ShowSupportSection />}
      {daoConstants.attackProfitability && (
        <AttackProfitabilitySection
          daoId={daoIdEnum}
          attackProfitability={daoConstants.attackProfitability}
        />
      )}
      <div className="flex flex-row gap-2">
        <StageTag tagStage={Stage.ZERO} daoStage={Stage.ONE} />
        <StageTag tagStage={Stage.ONE} daoStage={Stage.ONE} />
        <StageTag tagStage={Stage.TWO} daoStage={Stage.TWO} />
        <StageTag tagStage={Stage.ZERO} daoStage={Stage.ZERO} />
        <StageTag tagStage={Stage.TWO} daoStage={Stage.ZERO} />
        <StageTag tagStage={Stage.TWO} daoStage={Stage.ZERO} />
      </div>
      {daoConstants.governanceImplementation && (
        <GovernanceImplementationSection daoId={daoIdEnum} />
      )}
      {daoConstants.tokenDistribution && <TokenDistributionSection />}
      {daoConstants.governanceActivity && <GovernanceActivitySection />}
      <ShowYourSupportStickyBar />
    </>
  );
};
