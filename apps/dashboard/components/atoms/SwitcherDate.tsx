"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeInterval } from "@/lib/enums/TimeInterval";

export const SwitcherDate = ({
  setTimeInterval,
  defaultValue,
}: {
  setTimeInterval: (timeInterval: TimeInterval) => void;
  defaultValue: TimeInterval;
}) => {
  /**
   * This function is called when a new date is selected.
   * It handles the API call and updates the data accordingly.
   */

  return (
    <Tabs defaultValue={defaultValue}>
      <TabsList>
        <TabsTrigger
          className="min-w-[72px] px-1.5 py-0.5 text-sm font-medium"
          value={TimeInterval.SEVEN_DAYS}
          onClick={() => setTimeInterval(TimeInterval.SEVEN_DAYS)}
        >
          {TimeInterval.SEVEN_DAYS}
        </TabsTrigger>
        <TabsTrigger
          className="min-w-[72px] px-1.5 py-0.5 text-sm font-medium"
          value={TimeInterval.THIRTY_DAYS}
          onClick={() => setTimeInterval(TimeInterval.THIRTY_DAYS)}
        >
          {TimeInterval.THIRTY_DAYS}
        </TabsTrigger>
        <TabsTrigger
          className="min-w-[72px] px-1.5 py-0.5 text-sm font-medium"
          value={TimeInterval.NINETY_DAYS}
          onClick={() => setTimeInterval(TimeInterval.NINETY_DAYS)}
        >
          {TimeInterval.NINETY_DAYS}
        </TabsTrigger>
        <TabsTrigger
          className="min-w-[72px] px-1.5 py-0.5 text-sm font-medium"
          value={TimeInterval.ONE_YEAR}
          onClick={() => setTimeInterval(TimeInterval.ONE_YEAR)}
        >
          1y
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
