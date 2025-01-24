"use client";

import { TheSectionLayout, UniswapIcon } from "@/components/01-atoms";
import { UniswapDaoInfo } from "@/components/02-molecules";
import {
  GovernanceActivitySection,
  TokenDistributionSection,
} from "@/components/03-organisms";
import { daoInfoSectionAnchorID } from "@/lib/client/constants";
import { DaoIdEnum, daoIdToNameMap } from "@/lib/types/daos";

export const DaoInfoTemplate = ({ params }: { params: { daoId: string } }) => {
  const daoName = daoIdToNameMap[params.daoId as DaoIdEnum];

  return (
    <>
      <TheSectionLayout
        title={`${daoName} DAO Info`}
        icon={<UniswapIcon className="text-foreground" />}
        anchorId={daoInfoSectionAnchorID}
      >
        <UniswapDaoInfo />
      </TheSectionLayout>
      <TokenDistributionSection />
      <GovernanceActivitySection />
    </>
  );
};
