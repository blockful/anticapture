"use client";

import { MouseEvent } from "react";
import { RiskLevel } from "@/lib/enums";
import { cn } from "@/lib/client/utils";
import { Card } from "@/components/ui/card";
import { GovernanceImplementationField } from "@/lib/dao-config/types";
import { useScreenSize } from "@/lib/hooks/useScreenSize";

export const GovernanceImplementationCard = ({
  field,
  isOpen,
  onToggle,
}: {
  field: GovernanceImplementationField;
  isOpen: boolean;
  onToggle: (e: MouseEvent<HTMLDivElement>) => void;
}) => {
  const { isDesktop, isTablet } = useScreenSize();
  const riskStyles = {
    [RiskLevel.HIGH]: "bg-white/10 text-red-400 rounded-full",
    [RiskLevel.MEDIUM]: "bg-white/10 text-amber-500 rounded-full",
    [RiskLevel.LOW]: "bg-white/10 text-green-500 rounded-full",
    "undefined-risk-level": "bg-white/10 text-gray-500 rounded-full",
  };

  return (
    <Card
      className={cn(
        "flex w-full flex-col flex-wrap gap-3.5 rounded-b-none rounded-t-lg !border-b border-x-transparent !border-b-lightDark border-t-transparent p-3 shadow transition-all duration-200 hover:cursor-pointer sm:relative sm:gap-0 sm:border sm:border-lightDark sm:bg-dark md:w-[calc(50%-10px)] xl4k:max-w-full",
        isOpen
          ? "z-20 rounded-b-none sm:border-middleDark sm:bg-lightDark"
          : "sm:rounded-b-lg sm:hover:bg-lightDark",
      )}
      onClick={onToggle}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          {" "}
          <div className="relative flex size-4 shrink-0 items-center justify-center sm:size-6">
            {" "}
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
            <h3 className="truncate text-sm font-medium leading-tight text-[#FAFAFA]">
              {field.name}
            </h3>
            <div className="size-1 rounded-full bg-white bg-opacity-30" />
            <span className="shrink-0 truncate text-sm font-medium leading-tight text-[#71717a]">
              {field.value || ""}
            </span>
          </div>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-2">
          {" "}
          <span
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium leading-tight",
              riskStyles[field.riskLevel],
            )}
          >
            {field.riskLevel}
            <span className="inline-flex">
              <span className={cn("text-xs")}>•</span>
              <span
                className={cn(
                  "text-xs",
                  field.riskLevel === RiskLevel.LOW && "text-foreground",
                )}
              >
                •
              </span>
              <span
                className={cn(
                  "text-xs",
                  (field.riskLevel === RiskLevel.LOW ||
                    field.riskLevel === RiskLevel.MEDIUM) &&
                    "text-foreground",
                )}
              >
                •
              </span>
            </span>
          </span>
        </div>
      </div>
      <div
        className={cn(
          "z-20 rounded-b-lg border-transparent sm:absolute sm:border sm:border-t-0 sm:border-middleDark sm:bg-lightDark sm:px-4",
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
        <div className="pt-1">
          <p className="text-sm text-foreground">{field.description}</p>
        </div>
      </div>
    </Card>
  );
};
