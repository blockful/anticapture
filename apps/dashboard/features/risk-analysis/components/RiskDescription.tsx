import {
  AlertCircle,
  CheckCircle2,
  ChevronsRight,
  TriangleAlert,
} from "lucide-react";
import { ReactNode, useMemo } from "react";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { RiskLevelCardSmall } from "@/shared/components";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { CorneredBox } from "@/features/risk-analysis/components/CorneredBox";

export interface RequirementMetric extends GovernanceImplementationField {
  name: string;
}

export interface RiskDescriptionProps {
  title: string;
  defenseDefinition: string | string[];
  riskExposure: string | string[];
  riskLevel: RiskLevel;
  requirements?: RequirementMetric[];
  children?: ReactNode;
  onMetricClick?: (requirement: RequirementMetric) => void;
}

export const iconsMapping = {
  [RiskLevel.LOW]: <CheckCircle2 className="text-success size-5" />,
  [RiskLevel.MEDIUM]: <AlertCircle className="text-warning size-5" />,
  [RiskLevel.HIGH]: <TriangleAlert className="text-error size-5" />,
  [RiskLevel.NONE]: <></>,
} as const satisfies Record<RiskLevel, ReactNode>;

const normalizeToArray = (value: string | string[]): string[] =>
  Array.isArray(value) ? value : [value];

const ParagraphList = ({ items }: { items: string[] }) => (
  <>
    {items.map((paragraph, index) => (
      <p key={index} className={"text-primary text-sm leading-5"}>
        {paragraph}
      </p>
    ))}
  </>
);

const MetricButton = ({
  metric,
  onClick,
}: {
  metric: RequirementMetric;
  onClick?: (metric: RequirementMetric) => void;
}) => (
  <li className="flex items-center gap-2">
    {iconsMapping[metric.riskLevel]}
    <button
      onClick={() => onClick?.(metric)}
      className={
        "text-primary border-border-contrast hover:border-primary border-b border-dashed font-mono text-[13px] font-medium uppercase tracking-wider transition-colors"
      }
      aria-label={`View details for ${metric.name}`}
      type="button"
    >
      {metric.name}
    </button>
  </li>
);

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
    <section className="flex flex-col gap-2">
      {title && (
        <h3
          className={
            "text-secondary flex items-center gap-2 font-mono text-[13px] font-medium leading-5"
          }
        >
          <ChevronsRight className="size-4" />
          {title}
        </h3>
      )}
      {rightContent && <div>{rightContent}</div>}
      <div className="ml-6 flex flex-col gap-2">{children}</div>
    </section>
  );
};

export const RiskDescription = ({
  title,
  defenseDefinition,
  riskExposure,
  requirements = [],
  riskLevel,
  onMetricClick,
}: RiskDescriptionProps) => {
  const defenseDefinitionArray = useMemo(
    () => normalizeToArray(defenseDefinition),
    [defenseDefinition],
  );

  const riskExposureArray = useMemo(
    () => normalizeToArray(riskExposure),
    [riskExposure],
  );

  return (
    <CorneredBox className="bg-surface-background lg:bg-surface-default lg:flex lg:h-full lg:flex-col">
      <div className="flex flex-col lg:h-full lg:overflow-hidden">
        <header className="flex w-full flex-col justify-between gap-2 pb-5 lg:shrink-0 lg:flex-row lg:items-center lg:p-4">
          <h2 className="text-primary font-mono text-lg font-medium">
            {title}
          </h2>
          <RiskLevelCardSmall status={riskLevel} />
        </header>

        <div className={"border-border-default h-px w-full border"} />

        <div className="scrollbar-custom flex flex-col gap-4 py-4 lg:flex-1 lg:overflow-y-auto lg:p-4">
          <RiskInfoContainer title="DEFENSE DEFINITION">
            <ParagraphList items={defenseDefinitionArray} />
          </RiskInfoContainer>

          <div
            className={"border-border-default h-px w-full border border-dashed"}
          />

          <RiskInfoContainer title="RISK EXPOSURE">
            <ParagraphList items={riskExposureArray} />
          </RiskInfoContainer>

          <div
            className={"border-border-default h-px w-full border border-dashed"}
          />

          <RiskInfoContainer title="FRAMEWORK METRICS IN THIS AREA">
            <ul className="space-y-3" role="list">
              {requirements.map((requirement, index) => (
                <MetricButton
                  key={requirement.name || index}
                  metric={requirement}
                  onClick={onMetricClick}
                />
              ))}
            </ul>
          </RiskInfoContainer>
        </div>
      </div>
    </CorneredBox>
  );
};
