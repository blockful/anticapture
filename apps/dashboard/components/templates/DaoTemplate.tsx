"use client";

import {
  DaoInfoSection,
  ExtractableValueSection,
  GovernanceActivitySection,
  TokenDistributionSection,
  AttackCostSection,
} from "@/components/organisms";

export const DaoTemplate = () => {
  return (
    <>
      <DaoInfoSection />
      <AttackCostSection />
      <ExtractableValueSection />
      <TokenDistributionSection />
      <GovernanceActivitySection />
    </>
  );
};
