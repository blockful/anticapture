"use client";

import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { useScreenSize } from "@/shared/hooks";
import { RiskLevelCardSmall } from "@/shared/components/cards/RiskLevelCardSmall";
import { cn } from "@/shared/utils";

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
  const { isMobile } = useScreenSize();
  // Process description to handle both string and array of strings
  const descriptionArray = Array.isArray(description)
    ? description
    : description
      ? [description]
      : [];

  const content = (
    <div onClick={(e) => e.stopPropagation()} className="flex flex-col">
      <div className="mb-2 flex items-center gap-2">
        <h4 className="text-alternative-sm text-primary font-mono font-medium tracking-wider uppercase">
          {title}
        </h4>
        {riskLevel && <RiskLevelCardSmall status={riskLevel} />}
      </div>
      {/* Divider */}
      <div className="bg-light-dark mb-3 h-px" />
      <div className="text-secondary text-sm leading-tight font-normal">
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
  );

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div
            className="focus:ring-0 focus:outline-hidden data-[state=open]:border-none data-[state=open]:shadow-none data-[state=open]:ring-0 data-[state=open]:outline-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          sideOffset={10}
          className={cn(
            "border-light-dark bg-surface-background z-50 rounded-md border p-3 text-left shadow-lg",
            "w-fit max-w-[calc(100vw-2rem)] sm:max-w-md",
            "break-words whitespace-normal",
          )}
        >
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        sideOffset={10}
        avoidCollisions={true}
        className={cn(
          "border-light-dark bg-surface-background z-50 rounded-md border p-3 text-left shadow-lg",
          "w-fit max-w-[calc(100vw-2rem)] sm:max-w-md",
          "break-words whitespace-normal",
        )}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
};
