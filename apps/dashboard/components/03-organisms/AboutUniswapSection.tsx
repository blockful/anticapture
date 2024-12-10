"use client";

import {
  ContractsCard,
  QuorumCard,
  UniswapIcon,
  TimelockCard,
  VoteCard,
} from "@/components/01-atoms";

export const AboutUniswapSection = () => {
  return (
    <div className="flex h-full w-full flex-col gap-5">
      <div className="flex h-full w-full gap-3">
        <UniswapIcon className="text-foreground" />
        <h1 className="text-left text-3xl font-semibold text-white">
          About Uniswap
        </h1>
      </div>
      <div className="grid text-white md:grid-cols-2 lg:grid-cols-4">
        <ContractsCard />
        <VoteCard />
        <TimelockCard />
        <QuorumCard />
      </div>
    </div>
  );
};
