"use client";

import {
  DaoInfoSection,
  ExtractableValueSection,
  GovernanceActivitySection,
  TokenDistributionSection,
} from "@/components/organisms";

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
