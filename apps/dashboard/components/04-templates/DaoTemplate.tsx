"use client";

import {
  DaoInfoSection,
  ExtractableValueSection,
  GovernanceActivitySection,
  TokenDistributionSection,
} from "@/components/03-organisms";

export const DaoTemplate = () => {
  return (
    <>
      <DaoInfoSection />
      <ExtractableValueSection />
      <TokenDistributionSection />
      <GovernanceActivitySection />
    </>
  );
};
