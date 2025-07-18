"use client";

import { MouseEvent } from "react";
import { AccordionContentArea, RiskLevelCardSmall } from "@/shared/components";
import { GovernanceImplementationField } from "@/shared/dao-config/types";

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
    >
      <p className="text-secondary text-sm">{field.description}</p>
    </AccordionContentArea>
  );
};
