import { RiskAreaCard, RiskAreaCardEnum } from "@/shared/components";
import { RiskAreaConstants } from "@/shared/constants/risk-areas";
import { RiskLevel } from "@/shared/types/enums";
import { cn } from "@/shared/utils";

export interface RiskAreaItem extends RiskAreaConstants {
  name: string;
  riskLevel: RiskLevel;
}
export interface RiskAreasTooltipProps {
  items: RiskAreaItem[];
  footer?: string;
  className?: string;
}

export const RiskAreasTooltip = ({
  items,
  footer,
  className,
}: RiskAreasTooltipProps) => {
  const textColorMap = {
    [RiskLevel.HIGH]: "text-error",
    [RiskLevel.MEDIUM]: "text-warning",
    [RiskLevel.LOW]: "text-success",
    [RiskLevel.NONE]: "text-secondary",
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {items.map((item, index) => {
        return (
          <div key={index} className="flex w-full items-start gap-3">
            <div className="pt-0.75">
              <RiskAreaCard
                variant={RiskAreaCardEnum.PANEL_TABLE}
                riskArea={item}
              />
            </div>

            <div className="flex flex-1 flex-col gap-0.5">
              <p className="text-primary font-mono text-xs font-medium uppercase leading-4 tracking-wider">
                {item.title}
              </p>
              <p
                className={cn(
                  "line-clamp-2 text-xs font-medium leading-4",
                  textColorMap[item.riskLevel],
                )}
              >
                {item.description}
              </p>
            </div>
          </div>
        );
      })}

      {footer && (
        <p className="text-secondary text-xs font-medium leading-4">{footer}</p>
      )}
    </div>
  );
};
