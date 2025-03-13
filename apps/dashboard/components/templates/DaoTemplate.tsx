"use client";

import {
  DaoInfoSection,
  ExtractableValueSection,
  GovernanceActivitySection,
  TokenDistributionSection,
} from "@/components/organisms";
import { GovernanceImplementationSection } from "../organisms/GovernanceImplementationSection";

export const DaoTemplate = () => {
  return (
    <>
      <DaoInfoSection />
      <ExtractableValueSection />
      <GovernanceImplementationSection />
      <TokenDistributionSection />
      <GovernanceActivitySection />
    </>
  );
};
