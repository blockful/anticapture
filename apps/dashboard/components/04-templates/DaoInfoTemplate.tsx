"use client";

import { TheSectionLayout, UniswapIcon } from "@/components/01-atoms";
import { UniswapDaoInfo } from "@/components/02-molecules";
import {
  GovernanceActivitySection,
  TokenDistributionSection,
} from "@/components/03-organisms";
import { DaoId, daoIdToNameMap } from "@/lib/types/daos";

export const DaoInfoTemplate = ({ params }: { params: { daoId: string } }) => {
  const daoName = daoIdToNameMap[params.daoId as DaoId];

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
