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
import { TelegramBotMessage } from "@/components/atoms";

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
    <>
      <div className="w-full gap-2 sm:px-8 sm:py-3">
        <MessageStacker messages={messages} />
      </div>
      <div className="mx-auto flex flex-col items-center sm:gap-8 sm:px-8 sm:py-6 lg:gap-16">
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
        <ShowYourSupportStickyBar />
      </div>
    </>
  );
};
