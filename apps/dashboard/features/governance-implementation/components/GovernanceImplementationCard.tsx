"use client";

import { MouseEvent } from "react";
import { cn } from "@/shared/utils/";
import { Card } from "@/shared/components/ui/card";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { useScreenSize } from "@/shared/hooks";
import { RiskLevelCardSmall } from "@/shared/components";
import { RiskLevel } from "@/shared/types/enums";

const riskBoxStyles: Record<RiskLevel, string> = {
  [RiskLevel.HIGH]: "bg-error/12",
  [RiskLevel.MEDIUM]: "bg-warning/12",
  [RiskLevel.LOW]: "bg-success/12",
  [RiskLevel.NONE]: "bg-foreground/10",
};

const riskTextColors: Record<RiskLevel, string> = {
  [RiskLevel.HIGH]: "text-error",
  [RiskLevel.MEDIUM]: "text-warning",
  [RiskLevel.LOW]: "text-success",
  [RiskLevel.NONE]: "text-foreground",
};

export const GovernanceImplementationCard = ({
  field,
  isOpen,
  onToggle,
}: {
  field: GovernanceImplementationField & { name: string };
  isOpen: boolean;
  onToggle: (e: MouseEvent<HTMLDivElement>) => void;
}) => {
  const { isDesktop, isTablet } = useScreenSize();

  return (
    <Card
      className={cn(
        "!border-b-light-dark sm:border-light-dark sm:bg-surface-default xl4k:max-w-full border-b! flex w-full flex-col flex-wrap gap-3.5 rounded-b-none rounded-t-lg border-x-transparent border-t-transparent p-3 shadow-sm transition-all duration-200 hover:cursor-pointer sm:relative sm:gap-0 sm:border md:w-[calc(50%-10px)]",
        isOpen
          ? "sm:border-middle-dark sm:bg-surface-contrast z-20 rounded-b-none"
          : "sm:hover:bg-middle-dark sm:rounded-b-lg",
      )}
      onClick={onToggle}
    >
      {/* corner border */}
      {isOpen && (
        <div className="border-primary border-l-1 border-t-1 absolute left-0 top-0 size-3" />
      )}
      {/* corner border */}
      {isOpen && (
        <div className="border-primary border-r-1 border-t-1 absolute right-0 top-0 size-3" />
      )}

      <div className="relative flex w-full items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative flex size-4 shrink-0 items-center justify-center sm:size-6">
            <span
              className={cn(
                "text-secondary absolute mb-1 text-3xl font-thin transition-all duration-300",
                isOpen ? "rotate-90 opacity-0" : "opacity-100",
              )}
            >
              +
            </span>
            <span
              className={cn(
                "text-secondary absolute mb-1 text-3xl font-thin transition-all duration-300",
                isOpen ? "opacity-100" : "rotate-90 opacity-0",
              )}
            >
              -
            </span>
          </div>
          <div className="flex items-center gap-2 sm:flex-col md:flex-row md:text-center">
            {" "}
            <h3 className="text-primary truncate text-sm font-medium leading-tight">
              {field.name}
            </h3>
            <div className="size-1 rounded-full bg-white/30" />
            <span className="text-secondary shrink-0 truncate text-sm font-medium leading-tight">
              {field.value || ""}
            </span>
          </div>
        </div>
        <div>
          <RiskLevelCardSmall status={field.riskLevel} />
        </div>
      </div>

      <div
        className={cn(
          "sm:border-middle-dark sm:bg-surface-contrast z-20 rounded-b-lg border-transparent sm:absolute sm:border sm:border-t-0 sm:px-4",
          "-left-px top-full w-[calc(100%+2px)]",
          isOpen
            ? "visible h-auto transition-all duration-500 ease-in-out sm:pb-5"
            : "hidden transition-all duration-300 ease-in-out sm:invisible sm:h-0",
        )}
        onClick={(e) => {
          if (isDesktop || isTablet) {
            e.stopPropagation();
          }
        }}
      >
        {/* corner border */}
        <div className="border-primary border-b-1 border-l-1 absolute bottom-0 left-0 size-3" />
        {/* corner border */}
        <div className="border-primary border-b-1 border-r-1 absolute bottom-0 right-0 size-3" />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 pt-1">
            <p className="text-primary font-mono text-xs font-medium uppercase leading-4 tracking-[0.72px]">
              Definition
            </p>
            <p className="text-secondary text-sm">{field.description}</p>
          </div>

          {field.riskExplanation && (
            <div
              className={cn(
                "flex w-full flex-col gap-1 rounded-lg p-2",
                riskBoxStyles[field.riskLevel],
              )}
            >
              <p
                className={cn(
                  "font-mono text-xs font-medium uppercase leading-4 tracking-[0.72px]",
                  riskTextColors[field.riskLevel],
                )}
              >
                Risk explained
              </p>
              <p className="text-secondary text-sm">{field.riskExplanation}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
