import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { ChevronRight } from "lucide-react";
import { DotFilledIcon } from "@radix-ui/react-icons";

interface PendingCriteriaItemProps {
  field: GovernanceImplementationField & { name: string };
  onDetailsClick?: (
    field: GovernanceImplementationField & { name: string },
  ) => void;
}

export const PendingCriteriaItem = ({
  field,
  onDetailsClick,
}: PendingCriteriaItemProps) => {
  return (
    <div className="border-border-default bg-surface-default flex flex-col overflow-clip border">
      {/* Header */}
      <div className="bg-surface-contrast border-border-default flex items-center gap-6 border-b px-3 py-2.5">
        <div className="flex flex-1 items-center gap-1">
          <DotFilledIcon className="text-primary size-4 shrink-0" />
          <p className="text-primary font-mono text-[13px] font-medium uppercase tracking-wider">
            {field.name}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDetailsClick?.(field)}
          className="text-secondary flex shrink-0 cursor-pointer items-center gap-1 font-mono text-[13px] font-medium uppercase tracking-wider transition-colors duration-300 hover:text-white"
        >
          details
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 px-3 py-2.5 leading-5">
        <div className="flex items-start gap-2">
          <p className="text-secondary w-[80px] shrink-0 font-mono text-[13px] font-medium uppercase tracking-wider">
            Current
          </p>
          <p className="text-error flex-1 text-sm font-normal">
            {field.currentSetting ?? "No protections"}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <p className="text-secondary w-[80px] shrink-0 font-mono text-[13px] font-medium uppercase tracking-wider">
            Fix
          </p>
          <p className="text-primary flex-1 text-sm font-normal">
            {field.recommendedSetting ?? field.description}
          </p>
        </div>
      </div>
    </div>
  );
};
