"use client";

import { RiskLevel } from "@/lib/enums/RiskLevel";
import { RiskLevelCardSmall } from "@/components/atoms";

interface RiskTooltipCardProps {
  title?: string;
  description?: string | string[];
  riskLevel?: RiskLevel;
}

/**
 * Card component that displays a risk area tooltip with title, risk level, and description
 */
export const RiskTooltipCard = ({
  title,
  description,
  riskLevel = RiskLevel.LOW,
}: RiskTooltipCardProps) => {
  // Process description to handle both string and array of strings
  const descriptionArray = Array.isArray(description)
    ? description
    : description
      ? [description]
      : [];

  return (
    <div className="flex flex-col">
      {/* Arrow pointing up to the card */}
      <div className="flex justify-center">
        <div className="size-0 border-x-8 border-b-8 border-x-transparent border-b-lightDark" />
      </div>

      {/* Tooltip content */}
      <div className="rounded-md border border-lightDark bg-darkest p-3 text-left shadow-lg">
        {/* Content */}
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
    </div>
  );
};
