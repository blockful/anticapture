import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { Stage } from "@/shared/types/enums/Stage";
import { PendingCriteriaItem } from "@/features/resilience-stages/components/PendingCriteriaItem";
import { cn } from "@/shared/utils";

const NEXT_STAGE_CONFIG: Record<
  string,
  { label: string; colorClass: string }
> = {
  [Stage.NONE]: { label: "eligibility", colorClass: "text-error" },
  [Stage.ZERO]: { label: "Stage 1", colorClass: "text-warning" },
  [Stage.ONE]: { label: "Stage 2", colorClass: "text-success" },
  [Stage.TWO]: { label: "Stage 2", colorClass: "text-success" },
};

interface PendingCriteriaCardProps {
  pendingFields: (GovernanceImplementationField & { name: string })[];
  currentDaoStage: Stage;
  onMetricClick?: (
    field: GovernanceImplementationField & { name: string },
  ) => void;
}

export const PendingCriteriaCard = ({
  pendingFields,
  currentDaoStage,
  onMetricClick,
}: PendingCriteriaCardProps) => {
  const isNoStage = currentDaoStage === Stage.NONE;
  const nextStage = NEXT_STAGE_CONFIG[currentDaoStage];
  const fixCount = isNoStage ? 1 : pendingFields.length;

  return (
    <div className="bg-surface-default flex flex-1 flex-col overflow-clip">
      {/* Header */}
      <div className="border-border-default flex h-[124px] flex-col justify-between border-b p-4">
        <p className="text-primary font-mono text-[13px] font-medium uppercase tracking-wider">
          <span>pending</span> Criteria
        </p>
        <div className="flex flex-col gap-0.5">
          <p className="text-primary text-xl font-medium leading-7 tracking-[-0.1px]">
            {fixCount} {fixCount === 1 ? "fix" : "fixes"}{" "}
            {isNoStage ? "needed for" : "to reach"}{" "}
            {nextStage && (
              <span className={cn(nextStage.colorClass)}>
                {nextStage.label}
              </span>
            )}
          </p>
          <p className="text-secondary text-sm font-normal leading-5">
            Review the current setting and recommended fix for each metric.
          </p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {isNoStage ? (
            <div className="border-border-default flex flex-col gap-3 border px-3 py-2.5 leading-5">
              <div className="flex items-start gap-2">
                <p className="text-secondary w-[80px] shrink-0 font-mono text-[13px] font-medium uppercase tracking-wider">
                  Current
                </p>
                <p className="text-error flex-1 text-sm font-normal">
                  The DAO still relies on a centralized entity to execute
                  proposals, instead of its governor and timelock.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <p className="text-secondary w-[80px] shrink-0 font-mono text-[13px] font-medium uppercase tracking-wider">
                  Fix
                </p>
                <p className="text-primary flex-1 text-sm font-normal">
                  Enable autonomous proposal execution and implement a timelock
                  to ensure decentralized operations.
                </p>
              </div>
            </div>
          ) : (
            pendingFields.map((field) => (
              <PendingCriteriaItem
                key={field.name}
                field={field}
                onDetailsClick={onMetricClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
