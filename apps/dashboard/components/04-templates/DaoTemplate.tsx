"use client";

import {
  DaoInfoSection,
  GovernanceActivitySection,
  TokenDistributionSection,
} from "@/components/03-organisms";

export const DaoTemplate = () => {
  return (
    <>
      <DaoInfoSection />
      <TokenDistributionSection />
      <GovernanceActivitySection />
    </>
  );
};
