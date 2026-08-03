"use client";

import { RadioIndicator } from "@/shared/components/design-system/form/fields";
import { cn } from "@/shared/utils/cn";

import { BallotSection, ballotRowClassName } from "./BallotSection";

interface BasicVoteOptionsProps {
  choices: string[];
  value: number | null;
  onChange: (choice: number) => void;
}

/** Basic ballots are always For / Against / Abstain, in that Snapshot choice order. */
const BASIC_OPTIONS = [
  { label: "For", choice: 1, color: "text-success" },
  { label: "Against", choice: 2, color: "text-error" },
  { label: "Abstain", choice: 3, color: "text-primary" },
] as const;

export const BasicVoteOptions = ({
  value,
  onChange,
}: BasicVoteOptionsProps) => (
  <BallotSection
    options={BASIC_OPTIONS.map(({ label, choice }) => ({ label, choice }))}
    renderRow={({ choice, label }) => {
      const checked = value === choice;
      const color =
        BASIC_OPTIONS.find((option) => option.choice === choice)?.color ??
        "text-primary";
      return (
        <label
          className={cn(
            ballotRowClassName(checked),
            "hover:bg-surface-contrast group cursor-pointer px-[10px] py-2",
          )}
        >
          <RadioIndicator
            name="basic-vote"
            checked={checked}
            onChange={() => onChange(choice)}
          />
          <span
            className={cn(
              "font-inter text-[14px] font-normal not-italic leading-[20px]",
              color,
            )}
          >
            {label}
          </span>
        </label>
      );
    }}
  />
);
