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
import { useParams } from "next/navigation";

export const DaoInfoSection = () => {
  const { daoId }: { daoId: string } = useParams();

  const daoConstants = daoConstantsByDaoId[daoId.toUpperCase() as DaoIdEnum];

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
    >
      <DaoInfo />
    </TheSectionLayout>
  );
};
