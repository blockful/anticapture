"use client";

import {
  ContractsCard,
  VoteCard,
  TimelockCard,
  QuorumCard,
} from "@/components/01-atoms";
import { DaoConstants } from "@/lib/dao-constants/types";

export const DaoInfo = ({daoConstants}:{daoConstants: DaoConstants}) => {

  return (
    <div className="grid w-full gap-2 text-white md:grid-cols-2 lg:grid-cols-4 xl:gap-4">
      <ContractsCard daoConstants={daoConstants}/>
      <VoteCard  daoConstants={daoConstants}/>
      <TimelockCard  daoConstants={daoConstants}/>
      <QuorumCard />
    </div>
  );
};
