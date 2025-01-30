"use client";

import { TheSectionLayout, UniswapIcon } from "@/components/01-atoms";
import { DaoInfo } from "@/components/02-molecules";
import {
  GovernanceActivitySection,
  TokenDistributionSection,
} from "@/components/03-organisms";
import { daoInfoSectionAnchorID } from "@/lib/client/constants";
import daoConstantsByDaoId from "@/lib/dao-constants";
import { DaoIdEnum } from "@/lib/types/daos";

export const DaoTemplate = ({ params }: { params: { daoId: string } }) => {
  const daoConstants = daoConstantsByDaoId[params.daoId.toUpperCase() as DaoIdEnum];

  return (
    <>
      <TheSectionLayout
        title={`${daoConstants.name} DAO Info`}
        icon={<UniswapIcon className="text-foreground" />}
        anchorId={daoInfoSectionAnchorID}
      >
        <DaoInfo daoConstants={daoConstants}/>
      </TheSectionLayout>
      <TokenDistributionSection />
      <GovernanceActivitySection />
    </>
  );
};
