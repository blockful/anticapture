"use client";

import { RadioIndicator } from "@/shared/components/design-system/form/fields";
import { cn } from "@/shared/utils/cn";

import {
  BallotSection,
  ballotRowClassName,
  toBallotOptions,
} from "./BallotSection";

interface SingleChoiceOptionsProps {
  choices: string[];
  value: number | null;
  onChange: (choice: number) => void;
}

export const SingleChoiceOptions = ({
  choices,
  value,
  onChange,
}: SingleChoiceOptionsProps) => (
  <BallotSection
    options={toBallotOptions(choices)}
    renderRow={({ choice, label }) => {
      const checked = value === choice;
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
          <span className="font-inter text-primary text-[14px] font-normal not-italic leading-[20px]">
            {label}
          </span>
        </label>
      );
    }}
  />
);
