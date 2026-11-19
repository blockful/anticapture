"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";

/** Info icon that explains how the metric next to it is computed. */
export const InfoTooltip = ({ children }: { children: ReactNode }) => (
  <Tooltip
    tooltipContent={
      <p className="text-secondary text-left text-sm font-normal leading-5">
        {children}
      </p>
    }
    triggerClassName="inline-flex shrink-0 cursor-help items-center border-0 bg-transparent p-0"
  >
    <Info className="text-secondary size-3.5" />
  </Tooltip>
);
