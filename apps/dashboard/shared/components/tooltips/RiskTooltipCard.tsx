import { ReactNode } from "react";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { RiskLevelCardSmall } from "@/shared/components/cards/RiskLevelCardSmall";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";

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

  const titleComponent = (
    <div className="flex items-center gap-2">
      <h4 className="text-alternative-sm text-primary font-mono font-medium uppercase tracking-wider">
        {title}
      </h4>
      {riskLevel && <RiskLevelCardSmall status={riskLevel} />}
    </div>
  );

  const content = (
    <div onClick={(e) => e.stopPropagation()} className="flex flex-col">
      <div className="text-secondary text-sm font-normal leading-tight">
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

  return (
    <Tooltip title={titleComponent} tooltipContent={content}>
      {children}
    </Tooltip>
  );
};
