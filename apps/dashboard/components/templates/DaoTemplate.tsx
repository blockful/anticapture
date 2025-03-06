"use client";

import {
  DaoInfoSection,
  GovernanceActivitySection,
  TokenDistributionSection,
} from "@/components/organisms";

export const DaoTemplate = () => {
  return (
    <>
      <DaoInfoSection />
      <TokenDistributionSection />
      <GovernanceActivitySection />
    </>
  );
};
