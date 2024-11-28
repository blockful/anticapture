import { AttacksSection } from "@/components/ui/attacks-section";
import { DelegatesTable } from "@/components/ui/delegates-table";
import { HoldersTable } from "@/components/ui/holders-table";
import { InactiveDelegationsSection } from "@/components/ui/inactive-delegations-section";
import { ProfitabilitySection } from "@/components/ui/profitability-section";
import { SupplySection } from "@/components/ui/supply-section";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Governance dashboard",
  keywords: ["governance", "dao", "data"],
};

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between p-6 w-[98%] mx-auto xl:overflow-auto">
      <h1 className="text-white text-left w-full text-3xl font-semibold mb-7 pt-12">
        Overview
      </h1>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 grid-rows-[183px_auto]">
        <ProfitabilitySection />
        <InactiveDelegationsSection />
        <AttacksSection />
        <SupplySection />
      </div>
      <div className="mt-4 w-full grid grid-cols-1 xl:grid-cols-2 gap-4 grid-rows-[auto]">
        <HoldersTable />
        <DelegatesTable />
      </div>
    </main>
  );
}
