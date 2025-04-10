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
      {daoConstants.daoInfo && (
        <DaoInfoSection daoInfo={daoConstants.daoInfo} />
      )}
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
      {daoConstants.governanceActivity && (
        <GovernanceActivitySection />
      )}
    </>
  );
};
