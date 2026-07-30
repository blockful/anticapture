"use client";

import type { ReactNode } from "react";

import { getAllocationColor } from "@/features/governance/utils/allocationColor";
import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import { cn } from "@/shared/utils/cn";

import { BallotSection, toBallotOptions } from "./BallotSection";

/**
 * Stepper granularity. The design's sample allocations are all multiples of 5,
 * so clicking steps by 5; the value cell stays typeable for exact splits.
 */
const STEP = 5;
const TOTAL = 100;

interface AllocationVoteOptionsProps {
  choices: string[];
  value: Record<string, number> | null;
  onChange: (choice: Record<string, number>) => void;
  /** Dimmed second line under the option label (quadratic credit cost). */
  renderSecondaryLine?: (weight: number) => ReactNode;
}

/**
 * Weight-allocation ballot shared by the weighted and quadratic vote types:
 * a per-option stepper, a stacked allocation bar, and a running total that
 * must reach 100% before the vote can be submitted.
 */
export const AllocationVoteOptions = ({
  choices,
  value,
  onChange,
  renderSecondaryLine,
}: AllocationVoteOptionsProps) => {
  const weights: Record<string, number> =
    value ?? Object.fromEntries(choices.map((_, i) => [String(i + 1), 0]));

  const total = Object.values(weights).reduce((sum, w) => sum + (w || 0), 0);
  const remaining = TOTAL - total;
  const isComplete = total === TOTAL;

  const setWeight = (key: string, next: number) => {
    const others = total - (weights[key] ?? 0);
    // Never let the allocation exceed 100% — the Vote button unlocks at exactly 100.
    const clamped = Math.max(0, Math.min(next, TOTAL - others));
    onChange({ ...weights, [key]: clamped });
  };

  return (
    <BallotSection
      options={toBallotOptions(choices)}
      labelSlot={
        !isComplete && remaining > 0 ? (
          <BadgeStatus variant="warning">{remaining}% Remaining</BadgeStatus>
        ) : undefined
      }
      footer={
        <>
          <div className="bg-surface-contrast flex h-2 w-full items-start gap-[2px] overflow-hidden">
            {choices.map((label, index) => {
              const weight = weights[String(index + 1)] ?? 0;
              if (weight <= 0) return null;
              return (
                <div
                  key={label + index}
                  className="h-2 shrink-0"
                  style={{
                    width: `${weight}%`,
                    backgroundColor: getAllocationColor(index),
                  }}
                />
              );
            })}
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <p
              className={cn(
                "font-inter text-[12px] font-medium not-italic leading-4",
                isComplete ? "text-success" : "text-warning",
              )}
            >
              Total: {total}%
            </p>
            {!isComplete && (
              <p className="text-secondary font-inter text-[12px] font-normal not-italic leading-[18px]">
                Must equal 100% to vote
              </p>
            )}
          </div>
        </>
      }
      renderRow={({ choice, label }) => {
        const weight = weights[String(choice)] ?? 0;
        const index = choice - 1;
        return (
          <div className="border-border-default flex w-full items-center gap-2 border py-[6px] pl-[10px] pr-[6px]">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: getAllocationColor(index) }}
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-inter text-primary text-[14px] font-normal not-italic leading-[20px]">
                {label}
              </span>
              {renderSecondaryLine && (
                <span className="text-dimmed font-inter text-[12px] font-normal not-italic leading-[18px]">
                  {renderSecondaryLine(weight)}
                </span>
              )}
            </div>
            <div className="border-border-contrast flex shrink-0 items-stretch border">
              <button
                type="button"
                className="text-secondary hover:bg-surface-contrast font-inter flex size-[26px] items-center justify-center text-[14px] font-medium leading-[20px] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                disabled={weight <= 0}
                onClick={() => setWeight(String(choice), weight - STEP)}
                aria-label={`Decrease ${label} allocation`}
              >
                &minus;
              </button>
              <label className="border-border-contrast flex h-[26px] w-[48px] items-center justify-center border-x">
                <span className="sr-only">{label} allocation percent</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={`${weight}%`}
                  onChange={(event) => {
                    const parsed = parseInt(
                      event.target.value.replace(/\D/g, ""),
                      10,
                    );
                    setWeight(String(choice), isNaN(parsed) ? 0 : parsed);
                  }}
                  className={cn(
                    "font-inter w-full bg-transparent text-center text-[14px] font-normal not-italic leading-[20px] outline-none",
                    weight > 0 ? "text-primary" : "text-dimmed",
                  )}
                />
              </label>
              <button
                type="button"
                className="text-secondary hover:bg-surface-contrast font-inter flex size-[26px] items-center justify-center text-[14px] font-medium leading-[20px] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                disabled={remaining <= 0}
                onClick={() => setWeight(String(choice), weight + STEP)}
                aria-label={`Increase ${label} allocation`}
              >
                +
              </button>
            </div>
          </div>
        );
      }}
    />
  );
};
