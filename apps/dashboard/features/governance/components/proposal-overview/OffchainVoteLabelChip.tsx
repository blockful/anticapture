"use client";

import { presentOffchainVoteLabel } from "@/features/governance/utils/offchainVoteLabel";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { cn } from "@/shared/utils";

interface OffchainVoteLabelChipProps {
  label: string;
  proposalType?: string | null;
  className?: string;
  variant?: "badge" | "inline";
}

export const OffchainVoteLabelChip = ({
  label,
  proposalType,
  className,
  variant = "badge",
}: OffchainVoteLabelChipProps) => {
  const { display, full, showTooltip } = presentOffchainVoteLabel(
    label,
    proposalType,
  );

  const chip = (
    <span
      className={cn(
        "text-primary font-inter truncate text-left font-medium not-italic",
        variant === "badge"
          ? "bg-surface-default max-w-[200px] rounded-full px-[6px] py-[2px] text-[12px] leading-[16px]"
          : "max-w-[140px] text-sm leading-[20px]",
        className,
      )}
    >
      {display}
    </span>
  );

  if (!showTooltip) {
    return chip;
  }

  return (
    <Tooltip
      asChild
      triggerClassName="max-w-[200px]"
      tooltipContent={full}
      className="text-left"
    >
      {chip}
    </Tooltip>
  );
};
