import { cn } from "@/shared/utils";
import {
  getBackgroundStatusColor,
  getStatusText,
  getTextStatusColor,
} from "@/features/governance/components/proposal-overview/ProposalItem";
import { ProposalStatus } from "@/features/governance/types";

export const ProposalBadge = ({ status }: { status: ProposalStatus }) => {
  return (
    <div
      className={cn(
        "bg-surface-opacity-brand text-link font-inter flex rounded-full px-[6px] py-[2px] text-xs",
        getTextStatusColor(status),
        getBackgroundStatusColor(status),
      )}
    >
      {getStatusText(status)}
    </div>
  );
};
