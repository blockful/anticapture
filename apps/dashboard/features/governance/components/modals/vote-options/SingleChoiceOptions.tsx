"use client";

import { RadioIndicator } from "@/shared/components/design-system/form/fields";
import { cn } from "@/shared/utils/cn";

interface SingleChoiceOptionsProps {
  choices: string[];
  value: number | null;
  onChange: (choice: number) => void;
}

export const SingleChoiceOptions = ({
  choices,
  value,
  onChange,
}: SingleChoiceOptionsProps) => {
  return (
    <div className="flex flex-col gap-2">
      {choices.map((label, index) => {
        const choice = index + 1;
        const checked = value === choice;
        return (
          <label
            key={choice}
            className={cn(
              "hover:bg-surface-contrast group flex cursor-pointer items-center gap-2 border px-[10px] py-2 transition-colors duration-300",
              checked ? "border-highlight" : "border-border-default",
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
      })}
    </div>
  );
};
