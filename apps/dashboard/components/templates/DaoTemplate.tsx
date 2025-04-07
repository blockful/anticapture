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

  // EMPTY_ANALYSIS DAOs are handled by the layout
  if (disableDaoPage) {
    return null;
  }

  return (
    <>
      {/* Basic DAO info shown for all stages except EMPTY_ANALYSIS */}
      {daoConstants.daoInfo?.enabled && (
        <DaoInfoSection daoInfo={daoConstants.daoInfo} />
      )}

      {/* Show support section only for election stage */}
      {daoConstants.showSupport?.enabled && <ShowSupportSection />}

      {/* Attack profitability shown for all stages except EMPTY_ANALYSIS */}
      {daoConstants.attackProfitability?.enabled && (
        <AttackProfitabilitySection
          daoId={daoIdEnum}
          attackProfitability={daoConstants.attackProfitability}
        />
      )}

      {/* Governance implementation only shown for FULL stage if available */}
      {daoConstants.governanceImplementation?.enabled && (
        <GovernanceImplementationSection daoId={daoIdEnum} />
      )}

      {/* Token distribution shown for all stages except EMPTY_ANALYSIS */}
      {daoConstants.tokenDistribution?.enabled && <TokenDistributionSection />}

      {/* Governance activity only shown for FULL stage unless explicitly removed */}
      {daoConstants.governanceActivity?.enabled && (
        <GovernanceActivitySection />
      )}
    </>
  );
};
