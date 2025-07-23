"use client";

import {
  GlossaryData,
  GlossaryLetter,
  getAvailableLetters,
} from "@/features/glossary/glossary";

interface GlossaryKeyboardProps {
  glossaryData: GlossaryData;
  onLetterClick?: (letter: GlossaryLetter) => void;
}

const ALL_LETTERS: GlossaryLetter[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

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
          ? `${termCount} term${termCount !== 1 ? "s" : ""}`
          : "No terms available"
      }
      className={`flex w-8 items-center justify-center rounded-md border px-2 py-1 text-sm font-bold transition-all duration-200 ${
        isAvailable
          ? "bg-primary-foreground border-border text-primary hover:bg-surface-hover hover:border-primary cursor-pointer shadow-sm hover:shadow-md"
          : "bg-background border-border text-secondary cursor-not-allowed opacity-40"
      } `}
    >
      {letter}
    </button>
  );
};
