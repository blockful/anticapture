"use client";

import { CircleCheck } from "lucide-react";

import { presentOffchainVoteLabel } from "@/features/governance/utils/offchainVoteLabel";
import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import { Tooltip } from "@/shared/components/design-system/tooltips";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

interface OffchainVotedChipProps {
  /** Full label of the choice the wallet voted for. */
  voteLabel: string;
  proposalType?: string | null;
  votingPower: number;
  tokenSymbol: string;
  /** Vote timestamp, in Unix seconds. */
  votedAt: number;
  /** Opens the read-only voted modal. */
  onClick?: () => void;
}

/**
 * "You voted" indicator, shown everywhere a proposal appears once the connected
 * wallet has voted. Rows without a vote get no placeholder: absence is the signal.
 */
export const OffchainVotedChip = ({
  voteLabel,
  proposalType,
  votingPower,
  tokenSymbol,
  votedAt,
  onClick,
}: OffchainVotedChipProps) => {
  const { display } = presentOffchainVoteLabel(voteLabel, proposalType);
  const votedOn = new Date(votedAt * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const chip = (
    <BadgeStatus variant="success" icon={CircleCheck}>
      You voted {display}
    </BadgeStatus>
  );

  return (
    <Tooltip
      tooltipContent={`You voted: ${display} · ${formatNumberUserReadable(votingPower)} ${tokenSymbol} · ${votedOn}`}
    >
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="flex cursor-pointer items-center"
          aria-label={`You voted ${display}. Open your vote`}
        >
          {chip}
        </button>
      ) : (
        chip
      )}
    </Tooltip>
  );
};
