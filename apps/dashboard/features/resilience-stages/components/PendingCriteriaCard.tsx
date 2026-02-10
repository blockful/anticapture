import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { Stage } from "@/shared/types/enums/Stage";
import { PendingCriteriaItem } from "@/features/resilience-stages/components/PendingCriteriaItem";
import { cn } from "@/shared/utils";

const NEXT_STAGE_CONFIG: Record<
  string,
  { label: string; colorClass: string }
> = {
  [Stage.ZERO]: { label: "Stage 1", colorClass: "text-warning" },
  [Stage.ONE]: { label: "Stage 2", colorClass: "text-success" },
  [Stage.TWO]: { label: "Stage 2", colorClass: "text-success" },
};

interface PendingCriteriaCardProps {
  pendingFields: (GovernanceImplementationField & { name: string })[];
  currentDaoStage: Stage;
}

export const PendingCriteriaCard = ({
  pendingFields,
  currentDaoStage,
}: PendingCriteriaCardProps) => {
  const nextStage = NEXT_STAGE_CONFIG[currentDaoStage];
  const fixCount = pendingFields.length;

  return (
    <div className="bg-surface-default flex flex-1 flex-col overflow-clip">
      {/* Header */}
      <div className="border-border-default flex h-[124px] flex-col justify-between border-b p-4">
        <p className="text-primary font-mono text-[13px] font-medium uppercase tracking-wider">
          <span>pending</span> Criteria
        </p>
        <div className="flex flex-col gap-0.5">
          <p className="text-primary text-xl font-medium leading-7 tracking-[-0.1px]">
            {fixCount}{" "}
            {fixCount === 1 ? "fix" : "fixes"} to reach{" "}
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
          {pendingFields.map((field) => (
            <PendingCriteriaItem key={field.name} field={field} />
          ))}
        </div>
      </div>
    </div>
  );
};
