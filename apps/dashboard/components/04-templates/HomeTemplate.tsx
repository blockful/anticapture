"use client";

import { TheSectionLayout, UniswapIcon } from "@/components/01-atoms";
import { UniswapDaoInfo } from "@/components/02-molecules";
import {
  GovernanceActivitySection,
  TokenDistributionSection,
} from "@/components/03-organisms";

export const HomeTemplate = () => {
  return (
    <main className="mx-auto flex flex-col items-center gap-8 px-8 py-6 lg:gap-16 xl:overflow-auto">
      <TheSectionLayout
        title="Uniswap DAO Info"
        icon={<UniswapIcon className="text-foreground" />}
      >
        <UniswapDaoInfo />
      </TheSectionLayout>
      <TokenDistributionSection />
      <GovernanceActivitySection />
    </main>
  );
};
