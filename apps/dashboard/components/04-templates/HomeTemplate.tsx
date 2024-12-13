"use client";

import { DelegatesTable } from "../ui/delegates-table";
import { HoldersTable } from "../ui/holders-table";
import {
  ArrowLeftRight,
  SwitcherDate,
  UniswapIcon,
} from "@/components/01-atoms";
import {
  TokenDistributionTable,
  UniswapDaoInfo,
} from "@/components/02-molecules";
import { TheSection } from "@/components/03-organisms";

export const HomeTemplate = () => {
  return (
    <main className="mx-auto flex flex-col items-center gap-8 px-8 py-6 lg:gap-16 xl:overflow-auto">
      <TheSection
        title="Uniswap DAO Info"
        icon={<UniswapIcon className="text-foreground" />}
      >
        <UniswapDaoInfo />
      </TheSection>
      <TheSection
        title="Token Distribution"
        icon={<ArrowLeftRight className="text-foreground" />}
        switchDate={<SwitcherDate />}
      >
        <TokenDistributionTable />
      </TheSection>

      <div className="mt-4 grid w-full grid-cols-1 grid-rows-[auto] gap-4 xl:grid-cols-2">
        <HoldersTable />
        <DelegatesTable />
      </div>
    </main>
  );
};
