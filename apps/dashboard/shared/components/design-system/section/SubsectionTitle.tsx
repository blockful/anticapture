"use client";

import { cn } from "@/shared/utils";
import { ReactNode } from "react";

type SubsectionTitleProps = {
  subsectionTitle: string | ReactNode;
  subsectionDescription: string;
  dateRange: string;
  switcherComponent: ReactNode;
};

export const SubsectionTitle = ({
  subsectionTitle,
  subsectionDescription,
  dateRange,
  switcherComponent,
}: SubsectionTitleProps) => {
  return (
    <div
      className={cn("flex h-full w-full flex-col justify-between", {
        "flex-row": switcherComponent,
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
        {switcherComponent}
      </div>
    </div>
  );
};
