"use client";

import { useRef, type Ref } from "react";

import { cn } from "@/shared/utils/cn";

type JsonTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  errorLine?: number;
  showLineNumbers?: boolean;
  hasError?: boolean;
  ariaLabel?: string;
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

  const lineCount = value === "" ? 0 : value.split("\n").length;

  const gutterDigits = Math.max(2, String(lineCount).length);

  return (
    <div
      className={cn(
        "border-border-contrast bg-surface-default rounded-base flex overflow-hidden border transition-all duration-200",
        "focus-within:shadow-[var(--shadow-focus-ring)]",
        "max-h-[50vh] min-h-32 resize-y",
        hasError && "border-error",
        className,
      )}
    >
      {showLineNumbers && (
        <div
          ref={gutterRef}
          aria-hidden
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
        onScroll={(event) => {
          const gutter = gutterRef.current;
          if (gutter) gutter.scrollTop = event.currentTarget.scrollTop;
        }}
        placeholder={placeholder}
        spellCheck={false}
        aria-label={ariaLabel}
        className={cn(
          "text-primary placeholder:text-dimmed h-full w-full resize-none whitespace-pre bg-transparent py-2 pr-2.5 font-mono text-xs leading-5",
          "scrollbar-thin overflow-auto border-0 outline-none",
          showLineNumbers ? "pl-0" : "pl-2.5",
        )}
      />
    </div>
  );
};
