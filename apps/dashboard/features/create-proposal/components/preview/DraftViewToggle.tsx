"use client";

import { Pencil, Play } from "lucide-react";

import { PillTab } from "@/shared/components/design-system/tabs/pill-tab/PillTab";
import { cn } from "@/shared/utils/cn";

export type DraftViewMode = "editor" | "preview";

interface DraftViewToggleProps {
  mode: DraftViewMode;
  onChange: (mode: DraftViewMode) => void;
  /** Recipients see Preview only — the Editor pill is hidden. */
  showEditor?: boolean;
  /** Stretches the pills to fill the row (used on mobile, per Figma). */
  fullWidth?: boolean;
}

const TABS = [
  { value: "editor" as const, label: "Editor", Icon: Pencil },
  { value: "preview" as const, label: "Preview", Icon: Play },
];

export const DraftViewToggle = ({
  mode,
  onChange,
  showEditor = true,
  fullWidth = false,
}: DraftViewToggleProps) => {
  const visibleTabs = TABS.filter(
    (tab) => tab.value !== "editor" || showEditor,
  );

  return (
    <div
      role="tablist"
      aria-label="Draft view"
      className={cn("flex items-center gap-2", fullWidth && "w-full")}
    >
      {visibleTabs.map(({ value, label, Icon }) => (
        <PillTab
          key={value}
          isActive={mode === value}
          onClick={() => onChange(value)}
          className={cn(fullWidth && "flex-1 justify-center")}
          label={
            <span className="flex items-center gap-1.5">
              <Icon className="size-4" />
              {label}
            </span>
          }
        />
      ))}
    </div>
  );
};
