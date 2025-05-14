"use client";

import { ReactNode } from "react";
import { RiskLevel } from "@/lib/enums/RiskLevel";
import { RiskLevelCardSmall } from "@/components/atoms";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { cn } from "@/lib/client/utils";

interface RiskTooltipCardProps {
  title?: string;
  description?: string | string[];
  riskLevel?: RiskLevel;
  children?: ReactNode;
}

/**
 * Card component that displays a risk area tooltip with title, risk level, and description
 */
export const RiskTooltipCard = ({
  title,
  description,
  riskLevel = RiskLevel.LOW,
  children,
}: RiskTooltipCardProps) => {
  // Process description to handle both string and array of strings
  const descriptionArray = Array.isArray(description)
    ? description
    : description
      ? [description]
      : [];

  return (
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>

      <TooltipContent
        side="top"
        align="center"
        sideOffset={10}
        avoidCollisions={true}
        className={cn(
          "z-50 rounded-md border border-lightDark bg-darkest p-3 text-left shadow-lg",
          "w-fit max-w-[calc(100vw-2rem)] sm:max-w-md",
          "whitespace-normal break-words",
        )}
      >
        <div onClick={(e) => e.stopPropagation()} className="flex flex-col">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="font-mono text-[13px] font-medium uppercase tracking-wider text-white">
              {title}
            </h4>
            {riskLevel && <RiskLevelCardSmall status={riskLevel} />}
          </div>

          {/* Divider */}
          <div className="mb-3 h-px bg-lightDark" />

          <div className="text-sm font-normal leading-tight text-foreground">
            {descriptionArray.map((paragraph, index) => (
              <p
                key={index}
                className={index < descriptionArray.length - 1 ? "mb-2" : ""}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
