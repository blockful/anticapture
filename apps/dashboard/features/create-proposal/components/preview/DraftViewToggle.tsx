"use client";

import { Eye, Pencil } from "lucide-react";

import { cn } from "@/shared/utils/cn";

export type DraftViewMode = "editor" | "preview";

interface DraftViewToggleProps {
  mode: DraftViewMode;
  onChange: (mode: DraftViewMode) => void;
  /** Recipients see Preview only — the Editor pill is hidden. */
  showEditor?: boolean;
}

const pill = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[14px] font-medium leading-5 transition-colors",
    active
      ? "border-link text-link bg-surface-default"
      : "border-border-default text-secondary hover:text-primary",
  );

export const DraftViewToggle = ({
  mode,
  onChange,
  showEditor = true,
}: DraftViewToggleProps) => (
  <div
    role="tablist"
    aria-label="Draft view"
    className="flex items-center gap-2"
  >
    {showEditor && (
      <button
        type="button"
        role="tab"
        aria-selected={mode === "editor"}
        className={pill(mode === "editor")}
        onClick={() => onChange("editor")}
      >
        <Pencil className="size-4" />
        Editor
      </button>
    )}
    <button
      type="button"
      role="tab"
      aria-selected={mode === "preview"}
      className={pill(mode === "preview")}
      onClick={() => onChange("preview")}
    >
      <Eye className="size-4" />
      Preview
    </button>
  </div>
);
