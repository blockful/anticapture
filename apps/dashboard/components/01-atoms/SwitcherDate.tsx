"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const SwitcherDate = () => {
  /**
   * This function is called when a new date is selected.
   * It handles the API call and updates the data accordingly.
   */
  const handleNewDate = () => {
    console.log("New date selected");
  };

  enum Date {
    SEVEN_DAYS = "7d",
    THIRTY_DAYS = "30d",
    NINETY_DAYS = "90d",
    ONE_YEAR = "1y",
  }

  return (
    <Tabs defaultValue={Date.SEVEN_DAYS}>
      <TabsList>
        <TabsTrigger value={Date.SEVEN_DAYS} onClick={handleNewDate}>
          {Date.SEVEN_DAYS}
        </TabsTrigger>
        <TabsTrigger value={Date.THIRTY_DAYS}>{Date.THIRTY_DAYS}</TabsTrigger>
        <TabsTrigger value={Date.NINETY_DAYS}>{Date.NINETY_DAYS}</TabsTrigger>
        <TabsTrigger value={Date.ONE_YEAR}>{Date.ONE_YEAR}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
