"use client";

import { Checkbox } from "@/shared/components/design-system/form/fields/checkbox/Checkbox";
import { cn } from "@/shared/utils/cn";

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
    <div className="flex flex-col gap-2">
      {choices.map((label, index) => {
        const choice = index + 1;
        const checked = selected.includes(choice);
        return (
          <label
            key={choice}
            className={cn(
              "hover:bg-surface-contrast flex cursor-pointer items-center gap-2 border px-[10px] py-2 transition-colors duration-300",
              checked ? "border-highlight" : "border-border-default",
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
      })}
    </div>
  );
};
