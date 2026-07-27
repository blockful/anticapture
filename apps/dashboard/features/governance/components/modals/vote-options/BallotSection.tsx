"use client";

import { Fragment, type ReactNode, useMemo, useState } from "react";

import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { cn } from "@/shared/utils/cn";

/** Beyond this many options the list gets a filter input and a fixed-height scroll area. */
const OVERFLOW_THRESHOLD = 8;
/** ~7 rows tall (36px row + 8px gap), so the next row peeks under the fold. */
const SCROLL_MAX_HEIGHT = 308;

export interface BallotOption {
  /** 1-indexed Snapshot choice number. */
  choice: number;
  label: string;
}

interface BallotSectionProps {
  options: BallotOption[];
  renderRow: (option: BallotOption, position: number) => ReactNode;
  /** Right-aligned content in the "Your vote" label row (selection counter, remaining chip). */
  labelSlot?: ReactNode;
  /** Helper line under the option list (e.g. the ranked reorder hint). */
  helper?: ReactNode;
  /** Content under the list and helper (e.g. the weighted allocation bar and totals). */
  footer?: ReactNode;
}

/**
 * Shared shell for every off-chain ballot: the "Your vote" label row with an
 * optional right slot, the option list, and — once the list overflows — a filter
 * input plus a fixed-height scroll area.
 */
export const BallotSection = ({
  options,
  renderRow,
  labelSlot,
  helper,
  footer,
}: BallotSectionProps) => {
  const [filter, setFilter] = useState("");
  const isOverflowing = options.length > OVERFLOW_THRESHOLD;

  const visibleOptions = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(({ label }) => label.toLowerCase().includes(needle));
  }, [options, filter]);

  return (
    <div className="flex w-full flex-col gap-[6px]">
      <div className="flex w-full items-center justify-between gap-2">
        <p className="font-inter text-primary text-[12px] font-medium not-italic leading-4">
          Your vote
        </p>
        {labelSlot ??
          (isOverflowing ? (
            <span className="text-secondary font-inter text-[12px] font-normal not-italic leading-[18px]">
              {options.length} options
            </span>
          ) : null)}
      </div>

      <div className="flex w-full flex-col gap-2">
        {isOverflowing && (
          <Input
            hasIcon
            placeholder="Filter options..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter options"
          />
        )}

        <div
          className={cn(
            "flex w-full flex-col gap-2",
            isOverflowing && "overflow-y-auto",
          )}
          style={isOverflowing ? { maxHeight: SCROLL_MAX_HEIGHT } : undefined}
        >
          {visibleOptions.map((option, position) => (
            <Fragment key={option.choice}>
              {renderRow(option, position)}
            </Fragment>
          ))}
          {visibleOptions.length === 0 && (
            <p className="text-dimmed font-inter text-[12px] font-normal not-italic leading-[18px]">
              No options match your filter.
            </p>
          )}
        </div>

        {helper}

        {isOverflowing && (
          <p className="text-dimmed font-inter text-[12px] font-normal not-italic leading-[18px]">
            Scroll to see all {options.length} options
          </p>
        )}

        {footer}
      </div>
    </div>
  );
};

/** Shared option-row chrome: bordered row, orange border once selected. */
export const ballotRowClassName = (isSelected: boolean) =>
  cn(
    "flex w-full items-center gap-2 border transition-colors duration-300",
    isSelected ? "border-highlight" : "border-border-default",
  );

export const toBallotOptions = (choices: string[]): BallotOption[] =>
  choices.map((label, index) => ({ choice: index + 1, label }));
