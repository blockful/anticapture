"use client";

import { cn } from "@/shared/utils";
import { ReactNode } from "react";

type SubsectionTitleProps = {
  subsectionTitle: string;
  subsectionDescription: string;
  dateRange: string;
  switchDate: ReactNode;
};

export const SubsectionTitle = ({
  subsectionTitle,
  subsectionDescription,
  dateRange,
  switchDate,
}: SubsectionTitleProps) => {
  return (
    <div
      className={cn("flex h-full w-full flex-col justify-between", {
        "flex-row": switchDate,
      })}
    >
      <div className="flex flex-col items-start">
        <p className="text-primary text-alternative-sm font-mono uppercase">
          {subsectionTitle}
        </p>
        <p className="text-secondary text-sm font-normal">
          {subsectionDescription}
          {dateRange}
        </p>
      </div>
      <div className="text-secondary flex items-center text-sm font-normal">
        {switchDate}
      </div>
    </div>
  );
};
