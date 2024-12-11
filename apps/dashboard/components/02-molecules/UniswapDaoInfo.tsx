"use client";

import {
  ContractsCard,
  VoteCard,
  TimelockCard,
  QuorumCard,
  Skeleton,
} from "@/components/01-atoms";
import { useContext } from "react";
import { DaoDataContext } from "@/components/contexts/dao-data-provider";

export const UniswapDaoInfo = () => {
  const { daoData } = useContext(DaoDataContext);

  return (
    <div className="grid text-white md:grid-cols-2 lg:grid-cols-4">
      <ContractsCard />
      <VoteCard />
      <TimelockCard />
      {daoData ? <QuorumCard daoData={daoData} /> : <Skeleton />}
    </div>
  );
};
