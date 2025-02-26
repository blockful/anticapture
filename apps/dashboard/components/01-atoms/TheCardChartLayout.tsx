"use client";

import { useState } from "react";
import { TheMultiLineChart } from "../02-molecules";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { SwitcherChart } from "./SwitcherChart";
import { useParams } from "next/navigation";
import { capitalizeFirstLetter } from "@/lib/client/utils";

export const TheCardChartLayout = ({ title }: { title: string }) => {
  const { daoId }: { daoId: string } = useParams();
  const [treasuryMetric, setTreasuryMetric] = useState<string>("All");
  const [costMetric, setCostMetric] = useState<string>("Quorum");

  const daoIdCapitalized = capitalizeFirstLetter(daoId);

  return (
    <Card className="flex flex-col rounded-lg border border-lightDark bg-dark shadow sm:max-w-full xl4k:max-w-full">
      <CardHeader className="flex flex-row justify-between rounded-t-lg px-4 py-3">
        <CardTitle className="flex items-center gap-2.5 text-sm font-medium leading-normal text-[#fafafa]">
          {title}
        </CardTitle>
        <div className="flex gap-3">
          <div className="flex gap-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-sm bg-green-500" />
              <p className="text-sm font-medium leading-normal text-[#a1a1aa]">
                Treasury
              </p>
            </div>
            <SwitcherChart
              defaultValue={treasuryMetric}
              setMetric={setTreasuryMetric}
              options={[`Non-${daoIdCapitalized}`, "All"]}
            />
          </div>
          <div className="flex items-center border-r border-[#27272a]" />

          <div className="flex gap-3">
            <div className="flex items-center gap-3">
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
      </CardHeader>

      <CardContent className="flex h-full w-full flex-col px-4 pb-4 lg:flex-row">
        <TheMultiLineChart />
      </CardContent>
    </Card>
  );
};
