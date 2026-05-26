"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { SpinIcon } from "@/shared/components/icons/SpinIcon";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { cn } from "@/shared/utils/cn";

export type StepState = "pending" | "active" | "done";

export type Step = {
  /** Icon rendered inside the circle when the step is pending or active. */
  icon: ReactNode;
  /** Primary label for the step. */
  label: string;
  /** Current state of the step. */
  state: StepState;
  /** Optional error message rendered below the label. */
  error?: string | null;
};

export type StepListProps = {
  steps: Step[];
  className?: string;
};

export const StepList = ({ steps, className }: StepListProps) => (
  <div
    className={cn(
      "border-border-default flex flex-col gap-1.5 border p-3",
      className,
    )}
  >
    {steps.map((step, i) => (
      <div key={i} className="flex flex-col">
        <StepRow {...step} />
        {i < steps.length - 1 && (
          <DividerDefault isVertical className="ml-3.5 h-6 w-0.5" />
        )}
      </div>
    ))}
  </div>
);

const StepRow = ({ icon, label, state, error }: Step) => {
  const backgroundColor =
    state === "done"
      ? "bg-surface-opacity-success"
      : state === "active"
        ? "bg-primary"
        : "bg-border-default";

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex w-full items-center gap-2">
        <div className="relative flex size-8 shrink-0 items-center justify-center">
          {state === "active" && (
            <SpinIcon className="text-link absolute inset-0 size-8 animate-spin" />
          )}
          <div
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full",
              backgroundColor,
            )}
          >
            <div className="border-border-default flex items-center justify-center rounded-full border p-1">
              {state === "done" ? (
                <Check className="text-success size-3.5" />
              ) : (
                icon
              )}
            </div>
          </div>
        </div>
        <p
          className={cn(
            "text-sm leading-5",
            state === "pending" ? "text-secondary" : "text-primary",
          )}
        >
          {label}
        </p>
      </div>

      {error && (
        <p className="text-error ml-11 break-words text-xs leading-4">
          {error}
        </p>
      )}
    </div>
  );
};
