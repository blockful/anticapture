import { AlertCircle, CheckCircle2, TriangleAlert } from "lucide-react";
import { ReactNode } from "react";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { RiskLevelCardSmall } from "@/shared/components";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { CorneredBox } from "@/features/risk-analysis/components/CorneredBox";

/**
 * Props for the RiskDescription component
 */
export interface RiskDescriptionProps {
  title: string;
  description: string | string[];
  requirements?: (GovernanceImplementationField & { name: string })[];
  children?: ReactNode;
  riskLevel?: RiskLevel;
}

/**
 * Component for displaying standardized risk descriptions
 */
export const RiskDescription = ({
  title,
  description,
  requirements = [],
  riskLevel,
}: RiskDescriptionProps) => {
  // Convert description to array if it's a string
  const descriptionArray = Array.isArray(description)
    ? description
    : [description];

  const iconsMapping: Record<RiskLevel, ReactNode> = {
    [RiskLevel.LOW]: <CheckCircle2 className="text-success size-5" />,
    [RiskLevel.MEDIUM]: <AlertCircle className="text-warning size-5" />,
    [RiskLevel.HIGH]: <TriangleAlert className="text-error size-5" />,
    [RiskLevel.NONE]: <></>,
  };

  return (
    <CorneredBox className="bg-surface-background sm:bg-surface-default p-4">
      <div className="flex flex-col gap-4">
        {/* Header with title and risk level */}
        <div className="flex w-full items-center justify-start gap-2">
          <h2 className="text-primary text-lg font-medium">{title}</h2>
          <RiskLevelCardSmall status={riskLevel} />
        </div>

        {/* Description paragraphs */}
        {descriptionArray.map((paragraph, index) => (
          <p key={index} className="text-secondary text-sm">
            {paragraph}
          </p>
        ))}

        {/* Requirements section with divider */}
        {requirements.length > 0 && (
          <div className="flex flex-col gap-4">
            {/* Thin divider line */}
            <div className="bg-light-dark h-px w-full" />

            <h3 className="text-alternative-sm text-primary font-mono font-medium tracking-wider">
              <span className="text-secondary">{`//`}</span> REQUIREMENTS
            </h3>
            <ul className="space-y-2">
              {requirements.map((requirement, index) => (
                <li key={index} className="flex items-center gap-2">
                  {iconsMapping[requirement.riskLevel]}
                  <span className="text-secondary text-sm">
                    {requirement.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </CorneredBox>
  );
};
