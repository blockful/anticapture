import type {
  OffchainProposalStatus,
  OffchainProposalStatusResult,
} from "@/features/governance/utils/offchainProposalStatus";
import { OFFCHAIN_STATUS_LABEL } from "@/features/governance/utils/offchainProposalStatus";
import {
  BadgeStatus,
  type BadgeStatusProps,
} from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import { cn } from "@/shared/utils/cn";

const STATUS_VARIANT: Record<
  OffchainProposalStatus,
  NonNullable<BadgeStatusProps["variant"]>
> = {
  pending: "dimmed",
  // Active is deliberately a white pill with black text, so it never reads as
  // the green "passed" badge at a glance.
  active: "primary",
  passed: "success",
  rejected: "error",
  closed: "outline",
};

interface OffchainProposalBadgeProps {
  status: OffchainProposalStatus;
  /** Winner from the status derivation; rendered beside a closed badge. */
  winner?: OffchainProposalStatusResult["winner"];
  className?: string;
}

export const OffchainProposalBadge = ({
  status,
  winner,
  className,
}: OffchainProposalBadgeProps) => (
  <div className={cn("flex min-w-0 items-center gap-2", className)}>
    <BadgeStatus
      variant={STATUS_VARIANT[status]}
      className={cn(status === "active" && "bg-primary text-inverted")}
    >
      {OFFCHAIN_STATUS_LABEL[status]}
    </BadgeStatus>
    {status === "closed" && winner && (
      <span className="text-secondary truncate font-mono text-xs">
        winner: {winner.label} · {winner.percent.toFixed(1)}%
      </span>
    )}
  </div>
);
