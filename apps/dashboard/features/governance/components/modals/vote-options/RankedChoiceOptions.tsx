"use client";

import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useEffect, useState } from "react";

import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";
import { cn } from "@/shared/utils/cn";

import { BallotSection, ballotRowClassName } from "./BallotSection";

interface RankedChoiceOptionsProps {
  choices: string[];
  value: number[] | null;
  onChange: (choice: number[]) => void;
}

export const RankedChoiceOptions = ({
  choices,
  onChange,
}: RankedChoiceOptionsProps) => {
  // 0-based choice indices held in ranked order.
  const [rankedIndices, setRankedIndices] = useState<number[]>(
    choices.map((_, i) => i),
  );
  const [draggedPosition, setDraggedPosition] = useState<number | null>(null);

  useEffect(() => {
    // Emit 1-indexed choices in ranked order.
    onChange(rankedIndices.map((i) => i + 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankedIndices]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= rankedIndices.length || from === to) return;
    setRankedIndices((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return next;
    });
  };

  return (
    <BallotSection
      options={rankedIndices.map((choiceIndex) => ({
        choice: choiceIndex + 1,
        label: choices[choiceIndex] ?? `Choice ${choiceIndex + 1}`,
      }))}
      helper={
        <p className="text-dimmed font-inter text-[12px] font-normal not-italic leading-[18px]">
          Drag to reorder — all options must be ranked
        </p>
      }
      renderRow={({ choice, label }) => {
        // Rank comes from the ranked array, not the rendered position, so it stays
        // correct while the list is filtered.
        const position = rankedIndices.indexOf(choice - 1);
        const isDragged = draggedPosition === position;
        return (
          <div
            draggable
            onDragStart={() => setDraggedPosition(position)}
            onDragEnd={() => setDraggedPosition(null)}
            onDragOver={(event) => {
              event.preventDefault();
              if (draggedPosition === null || draggedPosition === position)
                return;
              move(draggedPosition, position);
              setDraggedPosition(position);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDraggedPosition(null);
            }}
            className={cn(
              ballotRowClassName(isDragged),
              "cursor-grab py-[6px] pl-[10px] pr-[6px] active:cursor-grabbing",
            )}
          >
            <GripVertical
              className="text-dimmed size-3.5 shrink-0"
              aria-hidden="true"
            />
            <span className="border-border-contrast text-secondary font-inter flex size-5 shrink-0 items-center justify-center border text-[12px] font-normal not-italic leading-4">
              {position + 1}
            </span>
            <span className="font-inter text-primary min-w-0 flex-1 text-left text-[14px] font-normal not-italic leading-[20px]">
              {label}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <IconButton
                icon={ChevronUp}
                variant="ghost"
                size="sm"
                disabled={position === 0}
                onClick={() => move(position, position - 1)}
                aria-label={`Move ${label} up`}
              />
              <IconButton
                icon={ChevronDown}
                variant="ghost"
                size="sm"
                disabled={position === rankedIndices.length - 1}
                onClick={() => move(position, position + 1)}
                aria-label={`Move ${label} down`}
              />
            </div>
          </div>
        );
      }}
    />
  );
};
