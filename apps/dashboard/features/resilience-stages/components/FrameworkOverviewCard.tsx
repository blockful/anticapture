import { DotFilledIcon } from "@radix-ui/react-icons";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { UnderlinedButton } from "@/shared/components/design-system/links/underlined-link";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { cn } from "@/shared/utils";

const RISK_GROUP_CONFIG = [
  {
    level: RiskLevel.HIGH,
    label: "HIGH RISK",
    textColor: "text-error",
    dotColor: "text-error",
  },
  {
    level: RiskLevel.MEDIUM,
    label: "MEDIUM RISK",
    textColor: "text-warning",
    dotColor: "text-warning",
  },
  {
    level: RiskLevel.LOW,
    label: "LOW RISK",
    textColor: "text-success",
    dotColor: "text-success",
  },
] as const;

interface FrameworkOverviewCardProps {
  highRiskFields: (GovernanceImplementationField & { name: string })[];
  mediumRiskFields: (GovernanceImplementationField & { name: string })[];
  lowRiskFields: (GovernanceImplementationField & { name: string })[];
  onMetricClick?: (
    field: GovernanceImplementationField & { name: string },
  ) => void;
}

export const FrameworkOverviewCard = ({
  highRiskFields,
  mediumRiskFields,
  lowRiskFields,
  onMetricClick,
}: FrameworkOverviewCardProps) => {
  const groups = [
    { config: RISK_GROUP_CONFIG[0], fields: highRiskFields },
    { config: RISK_GROUP_CONFIG[1], fields: mediumRiskFields },
    { config: RISK_GROUP_CONFIG[2], fields: lowRiskFields },
  ].filter((group) => group.fields.length > 0);

  return (
    <div className="bg-surface-default flex w-full flex-col lg:w-[379px] lg:shrink-0">
      {/* Header */}
      <div className="border-border-default flex h-[124px] flex-col justify-between border-b p-4">
        <div className="flex items-start justify-between">
          <p className="text-primary font-mono text-[13px] font-medium uppercase tracking-wider">
            Framework Overview
          </p>
          <Link
            href="https://blockful.gitbook.io/anticapture/anticapture/framework"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary flex items-center gap-1 font-mono text-[13px] font-medium uppercase tracking-wider transition-colors duration-300 hover:text-white"
          >
            details
            <ArrowUpRight className="size-[14px]" />
          </Link>
        </div>
        <p className="text-secondary text-sm font-normal leading-5">
          These metrics define the DAO&apos;s risk level. Select a metric to
          explore it, or open the full framework for more context.
        </p>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-1 items-start">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {groups.map((group, groupIndex) => (
            <div key={group.config.level}>
              {groupIndex > 0 && (
                <DividerDefault
                  isHorizontal
                  className="border-border-contrast mb-4 border-dashed bg-transparent"
                />
              )}
              <div className="flex flex-col gap-2">
                <p
                  className={cn(
                    "font-mono text-[13px] font-medium uppercase tracking-wider",
                    group.config.textColor,
                  )}
                >
                  {group.config.label}
                </p>
                <div className="flex flex-col gap-4">
                  {group.fields.map((field) => (
                    <div key={field.name} className="flex items-center gap-2">
                      <DotFilledIcon
                        className={cn("size-4 shrink-0", group.config.dotColor)}
                      />
                      <UnderlinedButton
                        className="text-primary border-border-contrast"
                        onClick={() => onMetricClick?.(field)}
                      >
                        {field.name}
                      </UnderlinedButton>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
