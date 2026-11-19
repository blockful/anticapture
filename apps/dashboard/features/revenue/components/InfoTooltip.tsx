"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";

import { parseTooltipText } from "@/features/revenue/utils/tooltipText";

/**
 * Tooltip copy as paragraphs with space between them, and formulas,
 * variables and computed values in a monospace font. Text follows the
 * conventions of `tooltipText.ts`; any other content is rendered as given.
 */
export const TooltipBody = ({ children }: { children: ReactNode }) => {
  if (typeof children !== "string") {
    return (
      <p className="text-secondary text-left text-sm font-normal leading-5">
        {children}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2 py-1 text-left">
      {parseTooltipText(children).map((paragraph, index) => (
        <p key={index} className="text-secondary text-sm font-normal leading-5">
          {paragraph.map((segment, segmentIndex) =>
            segment.kind === "code" ? (
              <code
                key={segmentIndex}
                className="text-primary bg-surface-default rounded-[3px] box-decoration-clone px-1 py-px font-mono text-[12.5px]"
              >
                {segment.value}
              </code>
            ) : (
              segment.value
            ),
          )}
        </p>
      ))}
    </div>
  );
};

/** Info icon that explains how the metric next to it is computed. */
export const InfoTooltip = ({ children }: { children: ReactNode }) => (
  <Tooltip
    tooltipContent={<TooltipBody>{children}</TooltipBody>}
    triggerClassName="inline-flex shrink-0 cursor-help items-center border-0 bg-transparent p-0"
  >
    <Info className="text-secondary size-3.5" />
  </Tooltip>
);
