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
      {daoConstants.daoInfo?.enabled && (
        <DaoInfoSection daoInfo={daoConstants.daoInfo} />
      )}
      {daoConstants.showSupport?.enabled && <ShowSupportSection />}
      {daoConstants.attackProfitability?.enabled && (
        <AttackProfitabilitySection
          daoId={daoIdEnum}
          attackProfitability={daoConstants.attackProfitability}
        />
      )}
      {daoConstants.governanceImplementation?.enabled && (
        <GovernanceImplementationSection daoId={daoIdEnum} />
      )}
      {daoConstants.tokenDistribution?.enabled && <TokenDistributionSection />}
      {daoConstants.governanceActivity?.enabled && (
        <GovernanceActivitySection />
      )}
    </>
  );
};
