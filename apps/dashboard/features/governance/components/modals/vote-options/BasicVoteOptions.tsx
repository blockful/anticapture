"use client";

import { RadioIndicator } from "@/shared/components/design-system/form/fields";
import { cn } from "@/shared/utils/cn";

interface BasicVoteOptionsProps {
  choices: string[];
  value: number | null;
  onChange: (choice: number) => void;
}

const BASIC_OPTIONS = [
  { label: "For", choice: 1, color: "text-success" },
  { label: "Against", choice: 2, color: "text-error" },
  { label: "Abstain", choice: 3, color: "text-primary" },
] as const;

export const BasicVoteOptions = ({
  value,
  onChange,
}: BasicVoteOptionsProps) => {
  return (
    <div className="flex flex-col gap-2">
      {BASIC_OPTIONS.map(({ label, choice, color }) => {
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
      })}
    </div>
  );
};
