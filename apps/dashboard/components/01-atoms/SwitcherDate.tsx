"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export enum TimeInterval {
  SEVEN_DAYS = "7d",
  THIRTY_DAYS = "30d",
  NINETY_DAYS = "90d",
  ONE_YEAR = "365d",
}

export const SwitcherDate = ({
  setTimeInterval,
  defaultValue
}: {
  setTimeInterval: (timeInterval: TimeInterval) => void;
  defaultValue: TimeInterval
}) => {
  /**
   * This function is called when a new date is selected.
   * It handles the API call and updates the data accordingly.
   */

  return (
    <Tabs defaultValue={defaultValue}>
      <TabsList>
        <TabsTrigger
          value={TimeInterval.SEVEN_DAYS}
          onClick={() => setTimeInterval(TimeInterval.SEVEN_DAYS)}
        >
          {TimeInterval.SEVEN_DAYS}
        </TabsTrigger>
        <TabsTrigger
          value={TimeInterval.THIRTY_DAYS}
          onClick={() => setTimeInterval(TimeInterval.THIRTY_DAYS)}
        >
          {TimeInterval.THIRTY_DAYS}
        </TabsTrigger>
        <TabsTrigger
          value={TimeInterval.NINETY_DAYS}
          onClick={() => setTimeInterval(TimeInterval.NINETY_DAYS)}
        >
          {TimeInterval.NINETY_DAYS}
        </TabsTrigger>
        <TabsTrigger
          value={TimeInterval.ONE_YEAR}
          onClick={() => setTimeInterval(TimeInterval.ONE_YEAR)}
        >
          1y
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
