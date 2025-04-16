"use client";

import {
  DaoInfoSection,
  AttackProfitabilitySection,
  GovernanceActivitySection,
  GovernanceImplementationSection,
  ShowSupportSection,
  TokenDistributionSection,
} from "@/components/organisms";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import daoConfigByDaoId from "@/lib/dao-config";
import { ShowYourSupportStickyBar } from "@/components/atoms/ShowYourSupportStickyBar";

export const DaoTemplate = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];
  const { disableDaoPage } = daoConstants;
  if (disableDaoPage) {
    return null;
  }

  return (
    <>
      {daoConstants.daoInfo && <DaoInfoSection daoId={daoIdEnum} />}
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
      <ShowYourSupportStickyBar 
        message="Is Arbitrum at risk? More data needs more research."
        buttonText="SIGN TO SHOW YOUR SUPPORT"
      />
    </>
  );
};
