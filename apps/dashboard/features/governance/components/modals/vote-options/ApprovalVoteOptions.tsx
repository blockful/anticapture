"use client";

import { Checkbox } from "@/shared/components/design-system/form/fields/checkbox/Checkbox";
import { cn } from "@/shared/utils/cn";

import {
  BallotSection,
  ballotRowClassName,
  toBallotOptions,
} from "./BallotSection";

interface ApprovalVoteOptionsProps {
  choices: string[];
  value: number[] | null;
  onChange: (choice: number[]) => void;
}

export const ApprovalVoteOptions = ({
  choices,
  value,
  onChange,
}: ApprovalVoteOptionsProps) => {
  const selected = value ?? [];

  const handleToggle = (choice: number) => {
    if (selected.includes(choice)) {
      onChange(selected.filter((c) => c !== choice));
    } else {
      onChange([...selected, choice]);
    }
  };

  return (
    <BallotSection
      options={toBallotOptions(choices)}
      labelSlot={
        <span className="text-secondary font-inter text-[12px] font-normal not-italic leading-[18px]">
          {selected.length} of {choices.length} selected
        </span>
      }
      renderRow={({ choice, label }) => {
        const checked = selected.includes(choice);
        return (
          <label
            className={cn(
              ballotRowClassName(checked),
              "hover:bg-surface-contrast cursor-pointer px-[10px] py-2",
            )}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={() => handleToggle(choice)}
            />
            <span className="font-inter text-primary text-[14px] font-normal not-italic leading-[20px]">
              {label}
            </span>
          </label>
        );
      }}
    />
  );
};
