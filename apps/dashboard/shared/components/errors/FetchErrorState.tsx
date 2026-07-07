"use client";

import { AlertOctagon } from "lucide-react";

import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";

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
    <BlankSlate
      variant="default"
      icon={AlertOctagon}
      description={message}
      className={className}
    >
      <button
        onClick={onRetry}
        className="text-link hover:text-link-hover text-sm underline"
      >
        Try again
      </button>
    </BlankSlate>
  );
};
