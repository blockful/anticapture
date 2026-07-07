"use client";

import { cn } from "@/shared/utils/cn";

interface FetchErrorStateProps {
  message: string;
  onRetry: () => void;
  className?: string;
}

/** Inline error + retry affordance for failed data fetches (feeds, tables). */
export const FetchErrorState = ({
  message,
  onRetry,
  className,
}: FetchErrorStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-4 py-8",
        className,
      )}
    >
      <p className="text-error text-sm">{message}</p>
      <button
        onClick={onRetry}
        className="text-link hover:text-link-hover text-sm underline"
      >
        Try again
      </button>
    </div>
  );
};
