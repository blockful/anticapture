"use client";

import { useState } from "react";
import { Vote, FileText, ArrowRightLeft, Users, Filter, X } from "lucide-react";
import { cn } from "@/shared/utils";
import {
  FeedEventType,
  FeedEventRelevance,
} from "@/features/activity-feed/types";

interface ActivityFeedFiltersProps {
  selectedTypes: FeedEventType[];
  selectedRelevances: FeedEventRelevance[];
  onTypesChange: (types: FeedEventType[]) => void;
  onRelevancesChange: (relevances: FeedEventRelevance[]) => void;
  className?: string;
}

const eventTypes: { value: FeedEventType; label: string; icon: typeof Vote }[] =
  [
    { value: "vote", label: "Votes", icon: Vote },
    { value: "proposal", label: "Proposals", icon: FileText },
    { value: "transfer", label: "Transfers", icon: ArrowRightLeft },
    { value: "delegation", label: "Delegations", icon: Users },
  ];

const relevances: {
  value: FeedEventRelevance;
  label: string;
  color: string;
}[] = [
  { value: "high", label: "High", color: "bg-surface-solid-error" },
  { value: "medium", label: "Medium", color: "bg-surface-solid-warning" },
  { value: "low", label: "Low", color: "bg-surface-solid-success" },
];

export const ActivityFeedFilters = ({
  selectedTypes,
  selectedRelevances,
  onTypesChange,
  onRelevancesChange,
  className,
}: ActivityFeedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleType = (type: FeedEventType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const toggleRelevance = (relevance: FeedEventRelevance) => {
    if (selectedRelevances.includes(relevance)) {
      onRelevancesChange(selectedRelevances.filter((r) => r !== relevance));
    } else {
      onRelevancesChange([...selectedRelevances, relevance]);
    }
  };

  const clearFilters = () => {
    onTypesChange([]);
    onRelevancesChange([]);
  };

  const hasActiveFilters =
    selectedTypes.length > 0 || selectedRelevances.length > 0;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "bg-surface-contrast hover:bg-surface-hover text-primary flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors md:hidden",
          hasActiveFilters && "bg-surface-opacity-brand",
        )}
      >
        <Filter className="size-4" />
        Filters
        {hasActiveFilters && (
          <span className="bg-brand text-primary-foreground rounded-full px-2 py-0.5 text-xs">
            {selectedTypes.length + selectedRelevances.length}
          </span>
        )}
      </button>

      {/* Filter content */}
      <div
        className={cn(
          "flex flex-col gap-4 md:flex-row md:items-center md:gap-6",
          !isOpen && "hidden md:flex",
        )}
      >
        {/* Event type filters */}
        <div className="flex flex-col gap-2">
          <span className="text-secondary text-xs font-medium uppercase tracking-wider">
            Event Type
          </span>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => toggleType(value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  selectedTypes.includes(value)
                    ? "bg-surface-action text-primary-foreground"
                    : "bg-surface-contrast text-secondary hover:bg-surface-hover hover:text-primary",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Relevance filters */}
        <div className="flex flex-col gap-2">
          <span className="text-secondary text-xs font-medium uppercase tracking-wider">
            Relevance
          </span>
          <div className="flex flex-wrap gap-2">
            {relevances.map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => toggleRelevance(value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  selectedRelevances.includes(value)
                    ? "bg-surface-action text-primary-foreground"
                    : "bg-surface-contrast text-secondary hover:bg-surface-hover hover:text-primary",
                )}
              >
                <span className={cn("size-2 rounded-full", color)} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-secondary hover:text-primary flex items-center gap-1 text-sm transition-colors"
          >
            <X className="size-4" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};
