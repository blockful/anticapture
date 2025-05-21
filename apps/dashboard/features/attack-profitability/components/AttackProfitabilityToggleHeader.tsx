"use client";

import { Dispatch, SetStateAction } from "react";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import { SwitcherChart } from "@/shared/components/charts/SwitcherChart";

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
    <div className="flex w-full items-start gap-5 sm:w-fit sm:items-end sm:gap-2 sm:pt-0 lg:flex-row lg:gap-3">
      <div className="flex flex-row flex-wrap items-center gap-2 lg:gap-3">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-xs bg-green-400" />
          <p className="hidden text-sm font-medium leading-normal text-foreground sm:flex">
            Treasury
          </p>
        </div>
        <SwitcherChart
          defaultValue={treasuryMetric}
          setMetric={setTreasuryMetric}
          options={[`Non-${daoId.toUpperCase() as DaoIdEnum}`, "All"]}
        />
      </div>
      <div className="items-center border-r border-light-dark lg:flex" />

      <div className="flex flex-row flex-wrap items-center gap-2 lg:gap-3">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-xs bg-red-400" />
          <p className="hidden text-sm font-medium leading-normal text-foreground sm:flex">
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
