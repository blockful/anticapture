import { SimpleProgressBar } from "@/shared/components";
import { cn } from "@/shared/utils";

export interface ActiveTokensTooltipProps {
  activeAmount: string;
  activePercentage: string;
  totalAmount: string;
  barPercentage: number;
  className?: string;
}

export const ActiveTokensProgress = ({
  percentage,
  activeAmount,
  activePercentage,
  totalAmount,
}: {
  percentage: number;
  activeAmount: string;
  activePercentage: string;
  totalAmount: string;
}) => {
  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-center gap-1">
        <span className="text-link text-sm leading-5">
          {activeAmount} ({activePercentage})
        </span>{" "}
        <span className="text-secondary text-sm leading-5">
          / {totalAmount}
        </span>
      </div>
      <SimpleProgressBar percentage={percentage} progressClassName="bg-link" />
    </div>
  );
};

export const ActiveTokensTooltip = ({
  activeAmount,
  activePercentage,
  totalAmount,
  barPercentage,
  className,
}: ActiveTokensTooltipProps) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-1">
        <ActiveTokensProgress
          percentage={barPercentage}
          activeAmount={activeAmount}
          activePercentage={activePercentage}
          totalAmount={totalAmount}
        />
        <div className="flex items-center gap-2 text-sm font-normal leading-5">
          <div className="flex items-center gap-2">
            <div className="bg-link rounded-xs size-2" />
            <span className="text-link text-sm leading-5">Active supply</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-dimmed rounded-xs size-2" />
            <span className="text-secondary text-sm leading-5">
              Circulating supply
            </span>
          </div>
        </div>
      </div>

      <p className="text-secondary text-xs font-medium leading-4">
        Click to see details
      </p>
    </div>
  );
};
