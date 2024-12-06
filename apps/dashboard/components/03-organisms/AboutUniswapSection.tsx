"use client";

import { UniswapIcon } from "@/components/01-atoms";

export const AboutUniswapSection = () => {
  return (
    <div className="flex h-full w-full flex-col gap-5">
      <div className="flex h-full w-full gap-3">
        <UniswapIcon className="text-foreground" />
        <h1 className="text-left text-3xl font-semibold text-white">
          About Uniswap
        </h1>
      </div>
      <div className="grid text-white lg:grid-cols-4">
        <div>CARD 1</div>
        <div>CARD 2</div>
        <div>CARD 3</div>
        <div>card 4</div>
      </div>
    </div>
  );
};
