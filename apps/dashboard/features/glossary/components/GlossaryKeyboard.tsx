"use client";

import {
  GlossaryData,
  GlossaryLetter,
  getAvailableLetters,
} from "@/features/glossary/glossary";
import { formatPlural } from "@/shared/utils";

interface GlossaryKeyboardProps {
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
      <div className="flex w-full gap-2 overflow-x-scroll md:hidden">
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
      <div className="mx-auto hidden w-full max-w-lg md:block">
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
    <button
      onClick={onClick}
      disabled={!isAvailable}
      title={
        isAvailable
          ? `${termCount} ${formatPlural(termCount, "term")}`
          : "No terms available"
      }
      className={`flex w-8 items-center justify-center rounded-md border px-2 py-1 text-sm font-medium transition-all duration-200 ${
        isAvailable
          ? "bg-surface-default border-border-contrast text-primary hover:bg-surface-hover hover:border-primary cursor-pointer shadow-sm hover:shadow-md"
          : "bg-surface-disabled border-border-contrast text-dimmed cursor-not-allowed"
      } `}
    >
      {letter}
    </button>
  );
};
