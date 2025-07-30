"use client";

import { MouseEvent } from "react";
import { AccordionContentArea, RiskLevelCardSmall } from "@/shared/components";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { RiskLevel } from "@/shared/types/enums";
import { cn } from "@/shared/utils";

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
  return (
    <AccordionContentArea
      id={field.name}
      title={field.name}
      secondaryText={field.value || ""}
      rightContent={<RiskLevelCardSmall status={field.riskLevel} />}
      isOpen={isOpen}
      onToggle={onToggle}
      className="md:w-[calc(50%-10px)]"
      showCorners={true}
    >
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
              "flex w-full flex-col gap-1 p-2",
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
    </AccordionContentArea>
  );
};
