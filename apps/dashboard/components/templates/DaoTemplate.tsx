"use client";

import {
  DaoInfoSection,
  AttackProfitabilitySection,
  GovernanceActivitySection,
  TokenDistributionSection,
} from "@/components/organisms";
import { GovernanceImplementationSection } from "../organisms/GovernanceImplementationSection";

export const DaoTemplate = () => {
  return (
    <>
      <DaoInfoSection />
      <AttackProfitabilitySection />
      <GovernanceImplementationSection />
      <TokenDistributionSection />
      <GovernanceActivitySection />
    </>
  );
};
