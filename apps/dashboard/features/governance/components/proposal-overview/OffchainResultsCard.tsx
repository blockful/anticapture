"use client";

import { CircleCheck, Hourglass, Lock } from "lucide-react";
import { useMemo } from "react";

import type { OffchainVoteIndexingStatus } from "@/features/governance/hooks/useOffchainVoteIndexing";
import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import { Tooltip } from "@/shared/components/design-system/tooltips";
import { cn } from "@/shared/utils/cn";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

/**
 * Shutter proposals hide the tally, not the turnout. Encrypted while voting is
 * open, then a short reveal window after it closes — never zeros in either case.
 */
type ShutterPhase = "none" | "encrypted" | "reveal-pending";

const SHUTTER_TOOLTIP =
  "Shutter encrypts every ballot until voting ends, so no one can see the running tally while the vote is live.";

interface OffchainResultsCardProps {
  choices: string[];
  /** Indexed per-choice voting power, aligned with `choices`. */
  scores: number[];
  /** Voting close timestamp, in Unix seconds. */
  end: number;
  isShutter?: boolean;
  /**
   * Per-choice voting power from a just-signed vote, aligned with `choices`.
   * Added on top of `scores` until the indexer catches up, so the vote shows
   * immediately with no blind window.
   */
  optimisticScores?: number[] | null;
  indexingStatus?: OffchainVoteIndexingStatus;
  isIndexingChipFading?: boolean;
  className?: string;
}

export const OffchainResultsCard = ({
  choices,
  scores,
  end,
  isShutter = false,
  optimisticScores = null,
  indexingStatus = "idle",
  isIndexingChipFading = false,
  className,
}: OffchainResultsCardProps) => {
  const effectiveScores = useMemo(() => {
    if (!optimisticScores) return scores;
    return choices.map(
      (_, index) => (scores[index] ?? 0) + (optimisticScores[index] ?? 0),
    );
  }, [choices, scores, optimisticScores]);

  const total = effectiveScores.reduce((sum, score) => sum + score, 0);

  const shutterPhase: ShutterPhase = useMemo(() => {
    if (!isShutter) return "none";
    const hasClosed = Date.now() >= end * 1000;
    if (!hasClosed) return "encrypted";
    // Once the reveal lands the tally is non-zero and the card renders normally.
    return total > 0 ? "none" : "reveal-pending";
  }, [isShutter, end, total]);

  const isConcealed = shutterPhase !== "none";

  const rows = useMemo(() => {
    const entries = choices.map((label, index) => ({
      label,
      score: effectiveScores[index] ?? 0,
    }));
    // Concealed tallies must keep the authored choice order: sorting by score
    // would leak the ranking the encryption is meant to hide.
    if (isConcealed) return entries;
    return [...entries].sort((a, b) => b.score - a.score);
  }, [choices, effectiveScores, isConcealed]);

  return (
    <div
      className={cn(
        "bg-surface-background border-border-default flex w-full flex-col border",
        className,
      )}
    >
      <div className="border-border-default flex items-center justify-between gap-2 border-b px-4 py-3">
        <p className="text-secondary text-alternative-sm font-mono font-medium uppercase">
          Current results
        </p>
        <IndexingChip status={indexingStatus} isFading={isIndexingChipFading} />
      </div>

      {shutterPhase === "encrypted" && (
        <ShutterBanner
          icon={Lock}
          label="Votes encrypted: results reveal when voting ends"
        />
      )}
      {shutterPhase === "reveal-pending" && (
        <ShutterBanner
          icon={Hourglass}
          label="Voting ended: decrypting votes, results in a few minutes"
        />
      )}

      {/* Elections routinely run 15+ candidates, so the list is capped and
          scrolls rather than pushing the sidebar off screen. The cap is ~7 rows
          (28px each plus a 12px gap), which clears the designed 6-row card
          without a scrollbar. Padding stays outside the scroll container so it
          does not eat into that budget. */}
      <div className="p-4">
        <div className="scrollbar-custom flex max-h-[280px] flex-col gap-3 overflow-y-auto overflow-x-hidden">
          {rows.map(({ label, score }, position) => {
            const percent = total > 0 ? (score / total) * 100 : 0;
            // No leading highlight while concealed — it would reveal the winner.
            const isLeading = !isConcealed && position === 0 && score > 0;
            return (
              <div key={label + position} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-[14px] leading-5">
                  <div className="flex min-w-0 items-center gap-2">
                    {!isConcealed && (
                      <p className="text-dimmed shrink-0 font-medium">
                        {position + 1}
                      </p>
                    )}
                    <p className="text-primary truncate">{label}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-secondary whitespace-nowrap">
                      {isConcealed ? "–" : formatNumberUserReadable(score)}
                    </p>
                    <p
                      className={cn(
                        "w-11 text-right font-medium",
                        isLeading ? "text-link" : "text-primary",
                      )}
                    >
                      {isConcealed ? "–" : `${percent.toFixed(1)}%`}
                    </p>
                  </div>
                </div>
                <div className="bg-surface-contrast flex h-1 w-full items-start">
                  {!isConcealed && (
                    <div
                      className={cn(
                        "h-1",
                        isLeading ? "bg-highlight" : "bg-primary",
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ShutterBanner = ({
  icon: Icon,
  label,
}: {
  icon: typeof Lock;
  label: string;
}) => (
  <Tooltip tooltipContent={SHUTTER_TOOLTIP}>
    <div className="bg-surface-contrast flex w-full items-center gap-2 px-4 py-2.5">
      <Icon className="text-secondary size-4 shrink-0" />
      <p className="text-primary text-left text-[14px] leading-5">{label}</p>
    </div>
  </Tooltip>
);

const IndexingChip = ({
  status,
  isFading,
}: {
  status: OffchainVoteIndexingStatus;
  isFading: boolean;
}) => {
  if (status === "idle") return null;

  const chipClassName = cn(
    "transition-opacity duration-300",
    isFading ? "opacity-0" : "opacity-100",
  );

  if (status === "indexed") {
    return (
      <BadgeStatus
        variant="success"
        icon={CircleCheck}
        className={chipClassName}
      >
        Indexed
      </BadgeStatus>
    );
  }

  if (status === "stuck") {
    return (
      <Tooltip tooltipContent="Snapshot has your vote. Our indexer is still catching up, so the tally below may lag for a moment.">
        <BadgeStatus
          variant="warning"
          className={cn(chipClassName, "uppercase")}
        >
          Confirmed on Snapshot — indexer catching up
        </BadgeStatus>
      </Tooltip>
    );
  }

  return (
    <BadgeStatus variant="warning" className={chipClassName}>
      Indexing your vote…
    </BadgeStatus>
  );
};
