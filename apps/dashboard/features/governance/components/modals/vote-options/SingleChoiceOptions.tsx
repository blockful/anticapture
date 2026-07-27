"use client";

import { ArrowUp } from "lucide-react";

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
}

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
  // Projected totals: the selected option gains the voter's power, so the
  // denominator grows too and every other row's share dips accordingly.
  const currentTotal =
    liveImpact?.scores.reduce((sum, score) => sum + score, 0) ?? 0;
  const projectedTotal =
    liveImpact && value !== null
      ? currentTotal + liveImpact.votingPower
      : currentTotal;

  return (
    <BallotSection
      options={toBallotOptions(choices)}
      renderRow={({ choice, label }) => {
        const checked = value === choice;
        const score = liveImpact?.scores[choice - 1] ?? 0;
        const projectedScore = checked
          ? score + (liveImpact?.votingPower ?? 0)
          : score;
        const percent =
          projectedTotal > 0 ? (projectedScore / projectedTotal) * 100 : 0;

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
                    className="bg-primary h-1"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {checked && liveImpact.votingPower > 0 && (
                  <span className="text-success font-inter flex shrink-0 items-center gap-1 text-[14px] leading-[20px]">
                    <ArrowUp className="size-3.5" aria-hidden="true" />
                    {formatNumberUserReadable(liveImpact.votingPower)}
                  </span>
                )}
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
