"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/shared/utils";

interface SwitchProps extends React.ComponentProps<
  typeof SwitchPrimitive.Root
> {
  label?: string;
}

function Switch({ className, label, ...props }: SwitchProps) {
  return (
    <div className="flex items-center gap-2">
      <SwitchPrimitive.Root
        data-slot="switch"
        className={cn(
          "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
          "focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=unchecked]:bg-surface-hover",
          "data-[state=checked]:bg-surface-solid-brand",
          "data-[state=unchecked]:hover:bg-dimmed",
          "data-[state=checked]:hover:bg-surface-solid-brand-hover",
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className={cn(
            "pointer-events-none block size-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
            "data-[state=checked]:translate-x-[22px]",
            "data-[state=unchecked]:translate-x-0.5",
          )}
        />
      </SwitchPrimitive.Root>
      {label && (
        <span className="text-primary select-none text-sm">{label}</span>
      )}
    </div>
  );
}

export { Switch };
