"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";
import { cn } from "@/shared/utils/cn";

interface RankedChoiceOptionsProps {
  choices: string[];
  value: number[] | null;
  onChange: (choice: number[]) => void;
}

export const RankedChoiceOptions = ({
  choices,
  onChange,
}: RankedChoiceOptionsProps) => {
  // rankedChoices holds choice indices (0-based) in ranked order
  const [rankedIndices, setRankedIndices] = useState<number[]>(
    choices.map((_, i) => i),
  );

  useEffect(() => {
    // Emit 1-indexed choices in ranked order
    onChange(rankedIndices.map((i) => i + 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankedIndices]);

  const moveUp = (position: number) => {
    if (position === 0) return;
    const next = [...rankedIndices];
    [next[position - 1], next[position]] = [next[position], next[position - 1]];
    setRankedIndices(next);
  };

  const moveDown = (position: number) => {
    if (position === rankedIndices.length - 1) return;
    const next = [...rankedIndices];
    [next[position], next[position + 1]] = [next[position + 1], next[position]];
    setRankedIndices(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {rankedIndices.map((choiceIndex, position) => (
        <div
          key={choiceIndex}
          className={cn(
            "border-border-default flex items-center gap-2 border px-[10px] py-2",
          )}
        >
          <span className="text-secondary font-inter w-5 shrink-0 text-[14px] font-normal not-italic leading-[20px]">
            {position + 1}
          </span>
          <span className="font-inter text-primary flex-1 text-[14px] font-normal not-italic leading-[20px]">
            {choices[choiceIndex]}
          </span>
          <div className="flex flex-col">
            <IconButton
              icon={ChevronUp}
              variant="ghost"
              size="sm"
              disabled={position === 0}
              onClick={() => moveUp(position)}
              aria-label="Move up"
            />
            <IconButton
              icon={ChevronDown}
              variant="ghost"
              size="sm"
              disabled={position === rankedIndices.length - 1}
              onClick={() => moveDown(position)}
              aria-label="Move down"
            />
          </div>
        </div>
      ))}
    </div>
  );
};
