"use client";

import {
  ContractsCard,
  VoteCard,
  TimelockCard,
  QuorumCard,
  Skeleton,
} from "@/components/01-atoms";
import { useDaoDataContext } from "@/components/contexts/DaoDataContext";

export const UniswapDaoInfo = () => {
  const { daoData } = useDaoDataContext();

  return (
    <div className="grid w-full gap-2 text-white md:grid-cols-2 lg:grid-cols-4 xl:gap-4">
      <ContractsCard />
      {daoData ? <VoteCard daoData={daoData} /> : <Skeleton />}
      <TimelockCard />
      {daoData ? <QuorumCard daoData={daoData} /> : <Skeleton />}
    </div>
  );
};
