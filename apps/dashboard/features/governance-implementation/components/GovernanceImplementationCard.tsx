"use client";

import { MouseEvent } from "react";
import { cn } from "@/shared/utils/";
import { Card } from "@/shared/components/ui/card";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { useScreenSize } from "@/shared/hooks";
import { RiskLevelCardSmall } from "@/shared/components";
import { RiskLevel } from "@/shared/types/enums";

const riskColors: Record<RiskLevel, string> = {
  [RiskLevel.HIGH]: "border-error",
  [RiskLevel.MEDIUM]: "border-warning",
  [RiskLevel.LOW]: "border-success",
  [RiskLevel.NONE]: "border-foreground",
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
        "relative flex w-full flex-col flex-wrap gap-3.5 rounded-none !border-b border-x-transparent !border-b-lightDark border-t-transparent p-3 shadow transition-all duration-200 hover:cursor-pointer sm:relative sm:gap-0 sm:border sm:border-lightDark sm:bg-dark md:w-[calc(50%-10px)] xl4k:max-w-full",
        isOpen
          ? "-none z-20 sm:border-middleDark sm:bg-lightDark"
          : "sm:hover:bg-middleDark",
      )}
      onClick={onToggle}
    >
      {/* corner border */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-0 size-3 -translate-x-[1px] -translate-y-[1px] border-l-2 border-t-2",
            riskColors[field.riskLevel],
          )}
        />
      )}
      {/* corner border */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-0 size-3 -translate-y-[1px] translate-x-[1px] border-r-2 border-t-2",
            riskColors[field.riskLevel],
          )}
        />
      )}

      <div className="relative flex w-full items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative flex size-4 shrink-0 items-center justify-center sm:size-6">
            <span
              className={cn(
                "absolute mb-1 text-3xl font-thin text-foreground transition-all duration-300",
                isOpen ? "rotate-90 opacity-0" : "opacity-100",
              )}
            >
              +
            </span>
            <span
              className={cn(
                "absolute mb-1 text-3xl font-thin text-foreground transition-all duration-300",
                isOpen ? "opacity-100" : "rotate-90 opacity-0",
              )}
            >
              -
            </span>
          </div>
          <div className="flex items-center gap-2 sm:flex-col md:flex-row md:text-center">
            {" "}
            <h3 className="truncate text-sm font-medium leading-tight text-white">
              {field.name}
            </h3>
            <div className="size-1 rounded-full bg-white bg-opacity-30" />
            <span className="text-iconSecondary shrink-0 truncate text-sm font-medium leading-tight">
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
          "relative z-20 border-transparent sm:absolute sm:border sm:border-t-0 sm:border-middleDark sm:bg-lightDark sm:px-4",
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
        <div
          className={cn(
            "absolute bottom-0 left-0 size-3 -translate-x-[1px] translate-y-[1px] border-b-2 border-l-2",
            riskColors[field.riskLevel],
          )}
        />
        {/* corner border */}
        <div
          className={cn(
            "absolute bottom-0 right-0 size-3 translate-x-[1px] translate-y-[1px] border-b-2 border-r-2",
            riskColors[field.riskLevel],
          )}
        />

        <div className="pt-1">
          <p className="text-sm text-foreground">{field.description}</p>
        </div>
      </div>
    </Card>
  );
};
