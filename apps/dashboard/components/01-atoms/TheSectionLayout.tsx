"use client";

import React from "react";
import { TooltipInfo } from "@/components/01-atoms";

export const TheSectionLayout = ({
  anchorId,
  icon,
  title,
  description,
  switchDate,
  children,
}: {
  anchorId?: string;
  icon?: React.JSX.Element;
  title: string;
  description?: string;
  switchDate?: React.JSX.Element;
  children: React.ReactNode;
}) => {
  return (
    <div className="flex h-full w-full flex-col gap-5" id={anchorId}>
      <div className="flex h-full w-full flex-col justify-between gap-2 sm:flex-row sm:gap-0">
        <div className="flex items-center gap-3">
          {icon}
          <h1 className="text-left text-xl font-medium tracking-[-0.05%] text-white sm:text-3xl">
            {title}
          </h1>
          <div>
            {description && (
              <p className="flex w-full flex-col text-start text-xs text-[#a1a1aa] sm:w-[75%] lg:w-[50%]">
                <TooltipInfo text={description} />
              </p>
            )}
          </div>
        </div>

        <div className="flex">{switchDate}</div>
      </div>
      {children}
    </div>
  );
};
