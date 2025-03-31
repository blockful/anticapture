"use client";

import {
  DaoInfoSection,
  AttackProfitabilitySection,
  GovernanceActivitySection,
  GovernanceImplementationSection,
  TokenDistributionSection,
} from "@/components/organisms";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import daoConstantsByDaoId from "@/lib/dao-constants";
import { ShowSupportSection } from "../organisms/ShowSupportSection";

export const DaoTemplate = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConstantsByDaoId[daoIdEnum];
  if (daoConstants.inAnalysis) {
    return null;
  }

  return (
    <>
      <DaoInfoSection daoId={daoIdEnum} />
      <ShowSupportSection />
      <AttackProfitabilitySection daoId={daoIdEnum} />
      {!!daoConstants.governanceImplementation && (
        <GovernanceImplementationSection daoId={daoIdEnum} />
      )}
      <TokenDistributionSection />
      {!daoConstants.removeGovernanceActivitySection && (
        <GovernanceActivitySection />
      )}
    </>
  );
};
