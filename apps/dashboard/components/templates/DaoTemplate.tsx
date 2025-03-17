"use client";

import {
  DaoInfoSection,
  AttackProfitabilitySection,
  GovernanceActivitySection,
  TokenDistributionSection,
} from "@/components/organisms";
import { GovernanceImplementationSection } from "../organisms/GovernanceImplementationSection";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import daoConstantsByDaoId from "@/lib/dao-constants";

export const DaoTemplate = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConstantsByDaoId[daoIdEnum];
  return (
    <>
      <DaoInfoSection daoId={daoIdEnum} />
      <AttackProfitabilitySection daoId={daoIdEnum} />

      <TokenDistributionSection />
      <GovernanceActivitySection />
      {!!daoConstants.governanceImplementation ? (
        <GovernanceImplementationSection daoId={daoIdEnum} />
      ) : (
        <></>
      )}
    </>
  );
};
