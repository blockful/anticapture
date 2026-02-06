import {
  AlertCircle,
  CheckCircle2,
  ChevronsRight,
  TriangleAlert,
} from "lucide-react";
import { ReactNode } from "react";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { GovernanceImplementationEnum } from "@/shared/types/enums";
import { RiskLevelCardSmall } from "@/shared/components";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { CorneredBox } from "@/features/risk-analysis/components/CorneredBox";

/**
 * Props for the RiskDescription component
 */
export interface RequirementMetric extends GovernanceImplementationField {
  name: string;
}

export interface RiskDescriptionProps {
  title: string;
  defenseDefinition: string | string[];
  riskExposure: string | string[];
  requirements?: RequirementMetric[];
  children?: ReactNode;
  riskLevel?: RiskLevel;
  onMetricClick?: (requirement: RequirementMetric) => void;
}

export const iconsMapping: Record<RiskLevel, ReactNode> = {
  [RiskLevel.LOW]: <CheckCircle2 className="text-success size-5" />,
  [RiskLevel.MEDIUM]: <AlertCircle className="text-warning size-5" />,
  [RiskLevel.HIGH]: <TriangleAlert className="text-error size-5" />,
  [RiskLevel.NONE]: <></>,
};

const RiskInfoContainer = ({
  children,
  title,
  rightContent,
}: {
  children: ReactNode;
  title?: string;
  rightContent?: ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-2">
      {title && (
        <h3 className="text-secondary flex items-center gap-2 font-mono text-[13px] font-medium leading-5">
          <ChevronsRight className="size-4" />
          {title}
        </h3>
      )}
      {rightContent && <div>{rightContent}</div>}
      <div className="ml-6 flex flex-col gap-2">{children}</div>
    </div>
  );
};

/**
 * Component for displaying standardized risk descriptions
 */
export const RiskDescription = ({
  title,
  defenseDefinition,
  riskExposure,
  requirements = [],
  riskLevel,
  onMetricClick,
}: RiskDescriptionProps) => {
  // Convert description to array if it's a string
  const defenseDefinitionArray = Array.isArray(defenseDefinition)
    ? defenseDefinition
    : [defenseDefinition];

  const riskExposureArray = Array.isArray(riskExposure)
    ? riskExposure
    : [riskExposure];

  return (
    <CorneredBox className="bg-surface-background lg:bg-surface-default">
      <div className="flex flex-col">
        {/* Header with title and risk level */}
        <div className="flex w-full items-center justify-between gap-2 p-4">
          <h2 className="text-primary text-lg font-medium">{title}</h2>
          <RiskLevelCardSmall status={riskLevel} />
        </div>

        <div className="bg-surface-contrast h-px w-full" />

        <div className="flex flex-col gap-4 p-4">
          <RiskInfoContainer title="DEFENSE DEFINITION">
            {defenseDefinitionArray.map((paragraph, index) => (
              <p key={index} className="text-primary text-sm leading-5">
                {paragraph}
              </p>
            ))}
          </RiskInfoContainer>

          <div className="border-border-default h-px w-full border border-dashed" />

          <RiskInfoContainer title="RISK EXPOSURE">
            {riskExposureArray.map((paragraph, index) => (
              <p key={index} className="text-primary text-sm leading-5">
                {paragraph}
              </p>
            ))}
          </RiskInfoContainer>

          <div className="border-border-default h-px w-full border border-dashed" />

          <RiskInfoContainer title="FRAMEWORK METRICS IN THIS AREA">
            <ul className="space-y-3">
              {requirements.map((requirement, index) => (
                <li key={index} className="flex items-center gap-2">
                  {iconsMapping[requirement.riskLevel]}
                  <button
                    onClick={() => onMetricClick?.(requirement)}
                    className="text-primary border-border-contrast hover:border-primary border-b border-dashed font-mono text-[13px] font-medium uppercase tracking-wider transition-colors"
                  >
                    {requirement.name}
                  </button>
                </li>
              ))}
            </ul>
          </RiskInfoContainer>
        </div>
      </div>
    </CorneredBox>
  );
};
