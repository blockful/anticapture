import { CheckCircle2 } from "lucide-react";
import { ReactNode } from "react";
import { RiskLevel } from "@/lib/enums/RiskLevel";
import { RiskLevelCardSmall, CorneredBox } from "@/components/atoms";

/**
 * Interface for the requirements in RiskDescription
 */
export interface Requirement {
  text: string;
  checked?: boolean;
}

/**
 * Props for the RiskDescription component
 */
export interface RiskDescriptionProps {
  title: string;
  description: string | string[];
  requirements?: Requirement[];
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
  children,
  riskLevel = RiskLevel.LOW,
}: RiskDescriptionProps) => {
  // Convert description to array if it's a string
  const descriptionArray = Array.isArray(description)
    ? description
    : [description];

  return (
    <CorneredBox className="p-5 bg-darkest sm:bg-dark">
      {/* Header with title and risk level */}
      <div className="flex items-center justify-start gap-2 w-full mb-4">
        <h2 className="text-lg font-medium text-white">{title}</h2>
        <RiskLevelCardSmall status={riskLevel} />
      </div>

      {/* Description paragraphs */}
      <div>
        {descriptionArray.map((paragraph, index) => (
          <p key={index} className="text-sm text-foreground mb-4">
            {paragraph}
          </p>
        ))}

        {/* Requirements section with divider */}
        {requirements.length > 0 && (
          <>
            {/* Thin divider line */}
            <div className="h-px w-full bg-lightDark mb-4" />

            <h3 className="font-mono text-sm font-medium tracking-wider text-white mb-4">
              <span className="text-foreground">//</span> REQUIREMENTS
            </h3>
            <ul className="space-y-2">
              {requirements.map((requirement, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-success" />
                  <span className="text-sm text-foreground">
                    {requirement.text}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Any additional content */}
        {children}
      </div>
    </CorneredBox>
  );
};
