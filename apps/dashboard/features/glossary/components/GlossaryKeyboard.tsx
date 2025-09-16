"use client";

import {
  GlossaryData,
  GlossaryLetter,
  getAvailableLetters,
} from "@/features/glossary/glossary";
import { Button } from "@/shared/components";
import { cn, formatPlural } from "@/shared/utils";

interface GlossaryKeyboardProps {
  className?: string;
  glossaryData: GlossaryData;
  onLetterClick?: (letter: GlossaryLetter) => void;
}

// Letters are from A to Z
const ALL_LETTERS = Object.freeze(
  Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
) as GlossaryLetter[];

export function GlossaryKeyboard({
  glossaryData,
  onLetterClick,
}: GlossaryKeyboardProps) {
  const availableLetters = getAvailableLetters(glossaryData);

  const handleLetterClick = (letter: GlossaryLetter) => {
    if (availableLetters.includes(letter)) {
      // Scroll to the section
      const element = document.getElementById(`letter-${letter}`);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      // Call optional callback
      onLetterClick?.(letter);
    }
  };

  return (
    <>
      {/* Desktop keyboard */}
      <div className="mx-auto hidden w-full max-w-lg lg:block">
        <div className="grid grid-cols-7 justify-items-center gap-2">
          {ALL_LETTERS.map((letter) => {
            const isAvailable = availableLetters.includes(letter);
            const termCount = glossaryData[letter]?.length || 0;

            return (
              <KeyboardButton
                key={letter}
                letter={letter}
                isAvailable={isAvailable}
                termCount={termCount}
                onClick={() => handleLetterClick(letter)}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

// Export mobile keyboard as a separate component
export function GlossaryMobileKeyboard({
  className,
  glossaryData,
  onLetterClick,
}: GlossaryKeyboardProps) {
  const availableLetters = getAvailableLetters(glossaryData);

  const handleLetterClick = (letter: GlossaryLetter) => {
    if (availableLetters.includes(letter)) {
      // Scroll to the section
      const element = document.getElementById(`letter-${letter}`);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      // Call optional callback
      onLetterClick?.(letter);
    }
  };

  return (
    <div
      className={cn(
        "bg-surface-background border-border-default sticky top-[57px] z-10 flex w-full gap-2 overflow-x-scroll border-b px-4 py-3 sm:top-0 lg:hidden",
        className,
      )}
    >
      {ALL_LETTERS.map((letter) => {
        const isAvailable = availableLetters.includes(letter);
        const termCount = glossaryData[letter]?.length || 0;

        return (
          <KeyboardButton
            key={letter}
            letter={letter}
            isAvailable={isAvailable}
            termCount={termCount}
            onClick={() => handleLetterClick(letter)}
          />
        );
      })}
    </div>
  );
}

const KeyboardButton = ({
  letter,
  isAvailable,
  termCount,
  onClick,
}: {
  letter: GlossaryLetter;
  isAvailable: boolean;
  termCount: number;
  onClick: () => void;
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={!isAvailable}
      title={
        isAvailable
          ? `${termCount} ${formatPlural(termCount, "term")}`
          : "No terms available"
      }
      variant="outline"
      size="sm"
      className="w-full"
    >
      {letter}
    </Button>
  );
};
