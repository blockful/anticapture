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
import { MessageStacker } from "@/components/molecules";
import { TelegramBotMessage } from "@/components/atoms/messages/TelegramBotMessage";

export const DaoTemplate = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];
  const { disableDaoPage } = daoConstants;
  if (disableDaoPage) {
    return null;
  }

  const messages = [
    {
      id: "telegram-bot",
      content: <TelegramBotMessage />,
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col">
      <MessageStacker messages={messages} />
      {daoConstants.daoOverview && <DaoOverviewSection daoId={daoIdEnum} />}
      {daoConstants.showSupport && <ShowSupportSection />}
      {daoConstants.attackProfitability && (
        <AttackProfitabilitySection
          daoId={daoIdEnum}
          attackProfitability={daoConstants.attackProfitability}
        />
      )}
      {daoConstants.governanceImplementation && (
        <GovernanceImplementationSection daoId={daoIdEnum} />
      )}
      {daoConstants.tokenDistribution && <TokenDistributionSection />}
      {daoConstants.governanceActivity && <GovernanceActivitySection />}
      <ShowYourSupportStickyBar/>
    </div>
  );
};
