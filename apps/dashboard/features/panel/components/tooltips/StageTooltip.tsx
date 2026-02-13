import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { RiskLevel } from "@/shared/types/enums";
import { cn } from "@/shared/utils";

export interface StageTooltipProps {
  description: string;
  items?: [string, GovernanceImplementationField][];
  footer?: string;
  className?: string;
}

export const StageTooltip = ({
  description,
  items = [],
  footer,
  className,
}: StageTooltipProps) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-secondary whitespace-pre-wrap text-sm font-normal leading-5">
        {description}
      </p>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => {
            const borderColorMap = {
              [RiskLevel.HIGH]: "border-border-error",
              [RiskLevel.MEDIUM]: "border-border-warning",
              [RiskLevel.LOW]: "border-border-success",
              [RiskLevel.NONE]: "border-border-default",
            };

            const textColorMap = {
              [RiskLevel.HIGH]: "text-error",
              [RiskLevel.MEDIUM]: "text-warning",
              [RiskLevel.LOW]: "text-success",
              [RiskLevel.NONE]: "text-primary",
            };

            return (
              <div
                key={index}
                className={cn(
                  "flex flex-col gap-0.5 border-l pl-2",
                  borderColorMap[item[1].riskLevel],
                )}
              >
                <p className="text-primary font-mono text-xs font-medium uppercase leading-4 tracking-wider">
                  {item[0]}
                </p>
                <p
                  className={cn(
                    "text-xs font-medium leading-4",
                    textColorMap[item[1].riskLevel],
                  )}
                >
                  {item[1].value}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {footer && (
        <p className="text-secondary text-xs font-medium leading-4">{footer}</p>
      )}
    </div>
  );
};
