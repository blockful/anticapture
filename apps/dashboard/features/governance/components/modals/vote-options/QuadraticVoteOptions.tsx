"use client";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { cn } from "@/shared/utils/cn";

interface QuadraticVoteOptionsProps {
  choices: string[];
  value: Record<string, number> | null;
  onChange: (choice: Record<string, number>) => void;
  maxTotal?: number;
}

export const QuadraticVoteOptions = ({
  choices,
  value,
  onChange,
  maxTotal,
}: QuadraticVoteOptionsProps) => {
  const counts: Record<string, number> =
    value ?? Object.fromEntries(choices.map((_, i) => [String(i + 1), 0]));

  const currentTotal = Object.values(counts).reduce((a, b) => a + b, 0);

  const handleIncrement = (key: string) => {
    onChange({ ...counts, [key]: (counts[key] ?? 0) + 1 });
  };

  const handleDecrement = (key: string) => {
    const current = counts[key] ?? 0;
    if (current <= 0) return;
    onChange({ ...counts, [key]: current - 1 });
  };

  return (
    <div className="flex flex-col gap-2">
      {choices.map((label, index) => {
        const key = String(index + 1);
        const count = counts[key] ?? 0;
        return (
          <div
            key={key}
            className={cn(
              "border-border-default flex items-center gap-2 border px-[10px] py-2",
            )}
          >
            <span className="font-inter text-primary flex-1 text-[14px] font-normal not-italic leading-[20px]">
              {label}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={count === 0}
                onClick={() => handleDecrement(key)}
              >
                -
              </Button>
              <span className="font-inter text-primary w-6 text-center text-[14px] font-normal not-italic leading-[20px]">
                {count}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={maxTotal !== undefined && currentTotal >= maxTotal}
                onClick={() => handleIncrement(key)}
              >
                +
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
