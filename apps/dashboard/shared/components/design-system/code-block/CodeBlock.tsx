"use client";

import { useState } from "react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { cn } from "@/shared/utils/cn";

type CodeBlockProps = {
  /** Text rendered in the block (may be a redacted form of `copyText`). */
  code: string;
  /** Text placed on the clipboard — defaults to `code`. */
  copyText?: string;
  /** Container overrides (e.g. a min height). */
  className?: string;
  /** Code element overrides (e.g. `break-all` for unbroken tokens). */
  codeClassName?: string;
};

/**
 * Bordered code surface with a labeled action button pinned flush on the
 * block's bottom-right corner — the same anatomy as the gov frontend's
 * calldata/Encode block. The button is nudged -1px on both axes so its
 * border overlaps the container's instead of stacking beside it.
 */
export const CodeBlock = ({
  code,
  copyText,
  className,
  codeClassName,
}: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText ?? code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <div
      className={cn(
        "border-border-contrast bg-surface-default relative w-full border p-3",
        className,
      )}
    >
      {/* pr-16 keeps the text clear of the corner button's column. */}
      <code
        className={cn(
          "text-secondary block min-w-0 whitespace-pre-wrap break-words pr-16 font-mono text-sm leading-5",
          codeClassName,
        )}
      >
        {code}
      </code>
      <Button
        variant="outline"
        size="sm"
        className="absolute -bottom-[1px] -right-[1px]"
        onClick={copy}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
};
