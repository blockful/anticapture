"use client";

import { UniswapIcon } from "@/components/01-atoms";
import { AttacksSection } from "../ui/attacks-section";
import { DelegatesTable } from "../ui/delegates-table";
import { HoldersTable } from "../ui/holders-table";
import { ProfitabilitySection } from "../ui/profitability-section";
import { SupplySection } from "../ui/supply-section";
import { UncertaintySection } from "../ui/uncertainty-section";

export const HomeTemplate = () => {
  return (
    <main className="mx-auto flex flex-col items-center justify-between p-6 xl:overflow-auto">
      <div className="mb-7 flex h-full w-full pt-12">
        <h1 className="flex h-full w-full gap-3 text-left text-3xl font-semibold text-white">
          <UniswapIcon className="text-foreground" />
          About Uniswap
        </h1>
      </div>
      <div className="grid w-full grid-cols-1 grid-rows-[183px_auto] gap-4 md:grid-cols-2">
        <ProfitabilitySection />
        <UncertaintySection />
        <AttacksSection />
        <SupplySection />
      </div>
      <div className="mt-4 grid w-full grid-cols-1 grid-rows-[auto] gap-4 xl:grid-cols-2">
        <HoldersTable />
        <DelegatesTable />
      </div>
    </main>
  );
};
