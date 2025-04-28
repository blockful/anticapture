"use client";

import { Dispatch, SetStateAction } from "react";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import { SwitcherChart } from "@/components/atoms";

export const AttackProfitabilityToggleHeader = ({
  treasuryMetric,
  setTreasuryMetric,
  costMetric,
  setCostMetric,
}: {
  treasuryMetric: string;
  setTreasuryMetric: Dispatch<SetStateAction<string>>;
  costMetric: string;
  setCostMetric: Dispatch<SetStateAction<string>>;
}) => {
  const { daoId }: { daoId: string } = useParams();

  return (
    <div className="flex w-full items-start gap-1 sm:w-fit sm:items-end sm:gap-2 sm:pt-0 lg:flex-row lg:gap-3">
      <div className="flex flex-row flex-wrap items-center gap-2 lg:gap-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-sm bg-green-500" />
          <p className="hidden text-sm font-medium leading-normal text-[#a1a1aa] sm:flex">
            Treasury
          </p>
        </div>
        <SwitcherChart
          defaultValue={treasuryMetric}
          setMetric={setTreasuryMetric}
          options={[`Non-${daoId.toUpperCase() as DaoIdEnum}`, "All"]}
        />
      </div>
      <div className="items-center border-r border-[#27272a] lg:flex" />

      <div className="flex flex-row flex-wrap items-center gap-2 lg:gap-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-sm bg-[#f87171]" />
          <p className="hidden text-sm font-medium leading-normal text-[#a1a1aa] sm:flex">
            Cost
          </p>
        </div>
        <SwitcherChart
          defaultValue={costMetric}
          setMetric={setCostMetric}
          options={["Quorum", "Delegated"]}
        />
      </div>
    </div>
  );
};
