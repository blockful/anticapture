import { AnimatedNumber } from "@/components/ui/animated-number";
import { DelegatesTable } from "@/components/ui/delegates-table";
import { HoldersTable } from "@/components/ui/holders-table";
import { InactiveDelegationsSection } from "@/components/ui/inactive-delegations-section";
import { SupplySection } from "@/components/ui/supply-section";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Governance dashboard",
  keywords: ["governance", "dao", "data"],
};

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between p-24 space-y-20 max-w-[900px] mx-auto">
      <SupplySection />
      <InactiveDelegationsSection />
      <div className="flex flex-col text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
        <h1 className="text-center w-full font-bold mb-10 border-b-4 pb-2 border-colored">
          Delegates to pass
        </h1>
        <div className="flex space-x-12 mx-auto">
          <div className="flex flex-col space-y-2 items-center bg-light rounded p-6">
            <p className="text-3xl">
              Top <AnimatedNumber num={9} />
            </p>
            <p>based on all delegates</p>
          </div>
          <div className="flex flex-col space-y-2 items-center bg-light rounded p-6">
            <p className="text-3xl">
              Top <AnimatedNumber num={16} />
            </p>
            <p>based on active delegates</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
        <h1 className="text-center w-full font-bold mb-10 border-b-4 pb-2 border-colored">
          Cost to pass
        </h1>
        <div className="flex space-x-24 mx-auto">
          <div className="flex flex-col space-y-2 items-center bg-light rounded p-6">
            <p className="text-3xl">
              $<AnimatedNumber num={3} />M
            </p>
            <p>based on delegated supply</p>
          </div>
          <div className="flex flex-col space-y-2 items-center bg-light rounded p-6">
            <p className="text-3xl">
              $<AnimatedNumber num={1} />M
            </p>
            <p>based on average turnout</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col text-center max-w-[90vw] lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
        <h1 className="text-center w-full font-bold border-b-4 pb-2 border-colored">
          Delegates
        </h1>
        <DelegatesTable />
      </div>
      <div className="flex flex-col text-center max-w-[90vw] lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
        <h1 className="text-center w-full font-bold border-b-4 pb-2 border-colored">
          Holders
        </h1>
        <HoldersTable />
      </div>
    </main>
  );
}
