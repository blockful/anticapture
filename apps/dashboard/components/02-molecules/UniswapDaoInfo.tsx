"use client";

import {
  ContractsCard,
  VoteCard,
  TimelockCard,
  QuorumCard,
} from "@/components/01-atoms";

export const UniswapDaoInfo = () => {
  return (
    <div className="grid text-white md:grid-cols-2 lg:grid-cols-4">
      <ContractsCard />
      <VoteCard />
      <TimelockCard />
      <QuorumCard />
    </div>
  );
};
