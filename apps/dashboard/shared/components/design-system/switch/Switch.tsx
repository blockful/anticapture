"use client";

import { cn } from "@/shared/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const Switch = ({
  checked,
  onCheckedChange,
  label,
  className,
}: SwitchProps) => {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
          checked ? "bg-tangerine" : "bg-zinc-600",
        )}
      >
        <span
          className={cn(
            "inline-block size-3.5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </button>
      {label && (
        <span className="text-primary text-sm font-normal">{label}</span>
      )}
    </label>
  );
};
