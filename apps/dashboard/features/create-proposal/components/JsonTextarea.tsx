"use client";

import { useRef, type Ref } from "react";

import { cn } from "@/shared/utils/cn";

/**
 * A textarea that can carry a line-number gutter, for callers whose messages cite a
 * line. Two things keep the numbers honest: the content must not soft-wrap, so it is
 * `whitespace-pre` and scrolls sideways, and the two columns must share an explicit
 * `leading-5` and the same vertical padding, or they drift apart with every line.
 */

type JsonTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** 1-based line to mark in the gutter, if any. */
  errorLine?: number;
  /**
   * Opt in to the line-number gutter. Off by default: a numbered column earns
   * its width only where something refers to a line, so a caller that never
   * mentions one gets a plain textarea.
   */
  showLineNumbers?: boolean;
  hasError?: boolean;
  ariaLabel?: string;
  /** Height belongs to the caller; the columns stretch to fill it. */
  className?: string;
  ref?: Ref<HTMLTextAreaElement>;
};

export const JsonTextarea = ({
  value,
  onChange,
  placeholder,
  errorLine,
  showLineNumbers = false,
  hasError = false,
  ariaLabel,
  className,
  ref,
}: JsonTextareaProps) => {
  const gutterRef = useRef<HTMLDivElement>(null);

  // No numbers at all while the box is empty. Numbering a document that isn't
  // there would sit "1" beside a fourteen-line placeholder.
  const lineCount = value === "" ? 0 : value.split("\n").length;

  // Sized to the digits it actually has to hold. A fixed column is either too
  // wide, which is dead space on every line, or too narrow the moment a document
  // passes its width. `ch` is exact here because the font is monospaced. Two
  // digits is the floor so the text doesn't shift sideways at line 10.
  const gutterDigits = Math.max(2, String(lineCount).length);

  return (
    <div
      className={cn(
        // The wrapper owns the field's surface, so the two columns read as one
        // control and the focus ring goes round both.
        "border-border-contrast bg-surface-default rounded-base flex overflow-hidden border transition-all duration-200",
        "focus-within:shadow-[var(--shadow-focus-ring)]",
        // Draggable, but bounded. Browsers clamp a resize to max-height, and
        // without one the field can be dragged taller than the screen, which
        // pushes the dialog's own footer out of reach and leaves no way back. The
        // cap is relative to the viewport so it holds on a laptop as well as a
        // large monitor, and the floor stops it being dragged shut.
        "max-h-[50vh] min-h-32 resize-y",
        hasError && "border-error",
        className,
      )}
    >
      {showLineNumbers && (
        <div
          ref={gutterRef}
          aria-hidden
          // Border-box, so the width covers its own padding and leaves exactly
          // the digits room to sit in.
          style={{ width: `calc(${gutterDigits}ch + 1rem)` }}
          className="text-dimmed pointer-events-none shrink-0 select-none overflow-hidden py-2 pl-2 pr-2 text-right font-mono text-xs leading-5"
        >
          {Array.from({ length: lineCount }, (_, index) => {
            const line = index + 1;
            return (
              <div
                key={line}
                className={line === errorLine ? "text-error" : ""}
              >
                {line}
              </div>
            );
          })}
        </div>
      )}

      <textarea
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        // Programmatic scrolling fires this too, so jumping to the first error
        // brings the gutter with it.
        onScroll={(event) => {
          const gutter = gutterRef.current;
          if (gutter) gutter.scrollTop = event.currentTarget.scrollTop;
        }}
        placeholder={placeholder}
        spellCheck={false}
        aria-label={ariaLabel}
        className={cn(
          "text-primary placeholder:text-dimmed h-full w-full resize-none whitespace-pre bg-transparent py-2 pr-2.5 font-mono text-xs leading-5",
          // The same scrollbar the tables use, from the shared utility rather
          // than a second definition of it, so the two stay in step.
          "scrollbar-thin overflow-auto border-0 outline-none",
          // The gutter's own right padding is the gap when it is there; without
          // it the field falls back to the design system's own inset.
          showLineNumbers ? "pl-0" : "pl-2.5",
        )}
      />
    </div>
  );
};
