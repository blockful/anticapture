"use client";

import { DaoIdEnum } from "@/lib/types/daos";
import { SwitcherChart } from "@/components/atoms";
import { Dispatch, SetStateAction } from "react";
import { useParams } from "next/navigation";

export const ExtractableValueToggleHeader = ({
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
    <div className="flex flex-row gap-2 md:gap-3">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="hidden items-center gap-3 lg:flex">
          <div className="h-2 w-2 rounded-sm bg-green-500" />
          <p className="text-sm font-medium leading-normal text-[#a1a1aa]">
            Treasury
          </p>
        </div>
        <SwitcherChart
          defaultValue={treasuryMetric}
          setMetric={setTreasuryMetric}
          options={[`Non-${daoId.toUpperCase() as DaoIdEnum}`, "All"]}
        />
      </div>
      <div className="hidden items-center border-r border-[#27272a] lg:flex" />

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="hidden items-center gap-3 lg:flex">
          <div className="h-2 w-2 rounded-sm bg-[#f87171]" />
          <p className="text-sm font-medium leading-normal text-[#a1a1aa]">
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
