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

const KEYBOARD_ROWS: GlossaryLetter[][] = [
  ["A", "B", "C", "D", "E", "F", "G"],
  ["H", "I", "J", "K", "L", "M", "N"],
  ["O", "P", "Q", "R", "S", "T", "U"],
  ["V", "W", "X", "Y", "Z"],
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
    <div className="mx-auto w-full max-w-lg">
      <div className="space-y-3">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {row.map((letter) => {
              const isAvailable = availableLetters.includes(letter);
              const termCount = glossaryData[letter]?.length || 0;

              return (
                <button
                  key={letter}
                  onClick={() => handleLetterClick(letter)}
                  disabled={!isAvailable}
                  title={
                    isAvailable
                      ? `${termCount} term${termCount !== 1 ? "s" : ""}`
                      : "No terms available"
                  }
                  className={`flex w-8 items-center justify-center rounded-md border px-2 py-1 text-sm font-bold transition-all duration-200 ${
                    isAvailable
                      ? "bg-primary-foreground border-border text-primary hover:bg-surface-hover hover:border-primary cursor-pointer shadow-sm hover:scale-105 hover:shadow-md"
                      : "bg-background border-border text-secondary cursor-not-allowed opacity-40"
                  } `}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
