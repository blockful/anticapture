"use client";

import { GlobeIcon, TheSectionLayout } from "@/components/atoms";
import {
  ContractsCard,
  QuorumCard,
  SecurityCouncilCard,
  TimelockCard,
  VoteCard,
} from "@/components/molecules";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import daoConstantsByDaoId from "@/lib/dao-constants";
import { DaoIdEnum } from "@/lib/types/daos";

export const DaoInfoSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const daoConstants = daoConstantsByDaoId[daoId];

  const DaoInfo = () => {
    return (
      <div className="grid w-full gap-2 text-white md:grid-cols-2 xl:gap-4">
        <ContractsCard daoConstants={daoConstants} />
        <VoteCard daoConstants={daoConstants} />
        <TimelockCard daoConstants={daoConstants} />
        <QuorumCard />
        <SecurityCouncilCard daoConstants={daoConstants} />
      </div>
    );
  };

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.daoInfo.title}
      icon={<GlobeIcon />}
      anchorId={SECTIONS_CONSTANTS.daoInfo.anchorId}
      className="gap-5 border-b-2 border-b-white/10 px-4 pb-8 pt-16 sm:gap-6 sm:px-0 sm:pb-0 sm:pt-0"
    >
      <DaoInfo />
    </TheSectionLayout>
  );
};
