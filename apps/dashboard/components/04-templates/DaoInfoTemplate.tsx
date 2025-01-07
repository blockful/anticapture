"use client";

import { TheSectionLayout, UniswapIcon } from "@/components/01-atoms";
import { UniswapDaoInfo } from "@/components/02-molecules";
import {
  GovernanceActivitySection,
  TokenDistributionSection,
} from "@/components/03-organisms";

export const DaoInfoTemplate = ({ params }: { params: { daoId: string } }) => {
  const { daoId } = params;

  return (
    <>
      <TheSectionLayout
        title={`${daoId} DAO Info`}
        icon={<UniswapIcon className="text-foreground" />}
      >
        <UniswapDaoInfo />
      </TheSectionLayout>
      <TokenDistributionSection />
      <GovernanceActivitySection />
    </>
  );
};
