"use client";

import { TheSectionLayout, UniswapIcon } from "@/components/01-atoms";
import { UniswapDaoInfo } from "@/components/02-molecules";
import {
  GovernanceActivitySection,
  TokenDistributionSection,
} from "@/components/03-organisms";

export const DaoInfoTemplate = ({
  params,
}: {
  params: { daoName: string };
}) => {
  const { daoName } = params;

  return (
    <>
      <TheSectionLayout
        title={`${daoName} DAO Info`}
        icon={<UniswapIcon className="text-foreground" />}
      >
        <UniswapDaoInfo />
      </TheSectionLayout>
      <TokenDistributionSection />
      <GovernanceActivitySection />
    </>
  );
};
