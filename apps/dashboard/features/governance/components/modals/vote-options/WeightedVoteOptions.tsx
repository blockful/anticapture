"use client";

import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { cn } from "@/shared/utils/cn";

interface WeightedVoteOptionsProps {
  choices: string[];
  value: Record<string, number> | null;
  onChange: (choice: Record<string, number>) => void;
}

export const WeightedVoteOptions = ({
  choices,
  value,
  onChange,
}: WeightedVoteOptionsProps) => {
  const weights: Record<string, number> =
    value ?? Object.fromEntries(choices.map((_, i) => [String(i + 1), 0]));

  const total = Object.values(weights).reduce((sum, w) => sum + (w || 0), 0);

  const handleChange = (key: string, raw: string) => {
    const parsed = parseInt(raw, 10);
    const next = { ...weights, [key]: isNaN(parsed) ? 0 : parsed };
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {choices.map((label, index) => {
        const key = String(index + 1);
        return (
          <div
            key={key}
            className="border-border-default flex items-center gap-2 border px-[10px] py-2"
          >
            <span className="font-inter text-primary flex-1 text-[14px] font-normal not-italic leading-[20px]">
              {label}
            </span>
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={weights[key] ?? 0}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-20"
            />
            <span className="text-secondary font-inter text-[14px] leading-[20px]">
              %
            </span>
          </div>
        );
      })}
      <p
        className={cn(
          "font-inter text-[14px] font-normal not-italic leading-[20px]",
          total === 100 ? "text-success" : "text-error",
        )}
      >
        Total: {total}%
      </p>
    </div>
  );
};
