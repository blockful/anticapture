"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SwitcherChartProps {
  setMetric: (metric: string) => void;
  defaultValue: string;
  options: string[];
}

export const SwitcherChart = ({
  setMetric,
  defaultValue,
  options,
}: SwitcherChartProps) => {
  return (
    <Tabs defaultValue={defaultValue} className="flex gap-1 rounded-md">
      <TabsList>
        {options.map((option) => (
          <TabsTrigger
            key={option}
            value={option}
            onClick={() => setMetric(option)}
          >
            {option}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
