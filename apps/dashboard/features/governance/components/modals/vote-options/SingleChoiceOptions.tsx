"use client";

import { RadioIndicator } from "@/shared/components/design-system/form/fields";
import { cn } from "@/shared/utils/cn";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

import {
  BallotSection,
  ballotRowClassName,
  toBallotOptions,
} from "./BallotSection";

/**
 * Live impact preview. Only single choice has a designed frame for this, so the
 * other ballots deliberately ship without per-row results.
 */
export interface LiveImpactPreview {
  /** Current indexed voting power per choice, aligned with `choices`. */
  scores: number[];
  /** The connected wallet's voting power, i.e. the shift its vote would cause. */
  votingPower: number;
  /**
   * The wallet's already-indexed ballot, when this is a revote. Its power is
   * part of `scores`, so the preview has to take it back out and model a
   * replacement — otherwise the old choice keeps its share and the voter is
   * counted twice in the denominator.
   */
  previous?: { choice: number; votingPower: number } | null;
}

/**
 * The tally the preview projects from: this wallet's already-indexed ballot
 * taken back out, so a revote replaces its power instead of adding a second
 * copy of it. Identical to the indexed scores for a first vote.
 */
export const liveImpactBaseline = ({
  scores,
  previous,
}: Pick<LiveImpactPreview, "scores" | "previous">): {
  scores: number[];
  total: number;
} => {
  const base = scores.map((score, index) =>
    previous?.choice === index + 1
      ? Math.max(0, score - previous.votingPower)
      : score,
  );
  return { scores: base, total: base.reduce((sum, score) => sum + score, 0) };
};

interface SingleChoiceOptionsProps {
  choices: string[];
  value: number | null;
  onChange: (choice: number) => void;
  liveImpact?: LiveImpactPreview | null;
}

export const SingleChoiceOptions = ({
  choices,
  value,
  onChange,
  liveImpact = null,
}: SingleChoiceOptionsProps) => {
  const baseline = liveImpact ? liveImpactBaseline(liveImpact) : null;

  // Projected totals: the selected option gains the voter's power, so the
  // denominator grows too and every other row's share dips accordingly.
  const currentTotal = baseline?.total ?? 0;
  const projectedTotal =
    liveImpact && value !== null
      ? currentTotal + liveImpact.votingPower
      : currentTotal;

  return (
    <BallotSection
      options={toBallotOptions(choices)}
      renderRow={({ choice, label }) => {
        const checked = value === choice;
        const score = baseline?.scores[choice - 1] ?? 0;
        const projectedScore = checked
          ? score + (liveImpact?.votingPower ?? 0)
          : score;
        const percent =
          projectedTotal > 0 ? (projectedScore / projectedTotal) * 100 : 0;
        // Split the bar so the voter sees their power as a green segment stacked
        // on top of the already-indexed share, instead of one opaque total.
        const currentPercent =
          projectedTotal > 0 ? (score / projectedTotal) * 100 : 0;
        const gainPercent = percent - currentPercent;

        return (
          <label
            className={cn(
              ballotRowClassName(checked),
              "hover:bg-surface-contrast group cursor-pointer px-[10px] py-2",
            )}
          >
            <RadioIndicator
              name="single-choice-vote"
              checked={checked}
              onChange={() => onChange(choice)}
            />
            <span
              className={cn(
                "font-inter text-primary text-[14px] font-normal not-italic leading-[20px]",
                liveImpact && "min-w-0 flex-1 truncate",
              )}
            >
              {label}
            </span>

            {liveImpact && (
              <>
                <div className="bg-surface-contrast flex h-1 w-[152px] shrink-0 items-start">
                  <div
                    className="bg-primary h-1 transition-[width] duration-300"
                    style={{ width: `${currentPercent}%` }}
                  />
                  {gainPercent > 0 && (
                    <div
                      className="bg-success h-1 transition-[width] duration-300"
                      style={{ width: `${gainPercent}%` }}
                    />
                  )}
                </div>
                <span className="text-secondary font-inter shrink-0 whitespace-nowrap text-[14px] font-normal leading-[20px]">
                  {formatNumberUserReadable(projectedScore)}
                </span>
                <span className="text-primary font-inter w-11 shrink-0 text-right text-[14px] font-medium leading-[20px]">
                  {percent.toFixed(1)}%
                </span>
              </>
            )}
          </label>
        );
      }}
    />
  );
};
