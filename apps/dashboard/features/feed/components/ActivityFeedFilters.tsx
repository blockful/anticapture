"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";

import type {
  FeedEventsQueryParams,
  OrderDirection,
} from "@anticapture/client";
import { type FeedRelevance, type FeedEventType } from "@anticapture/client";
import {
  Button,
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
} from "@/shared/components/";
import { RadioButton } from "@/shared/components/design-system/form/fields";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/utils/";

interface ActivityFeedFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FeedEventsQueryParams;
  onApplyFilters: (filters: FeedEventsQueryParams) => void;
  onClearFilters: () => void;
}

const relevanceOptions: { value: FeedRelevance; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const typeOptions: { value: FeedEventType; label: string }[] = [
  { value: "VOTE", label: "Vote" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "PROPOSAL_EXTENDED", label: "Proposal Extended" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "DELEGATION", label: "Delegation" },
];

const timestampToDate = (ts: number | undefined): Date | undefined => {
  if (!ts) return undefined;
  return new Date(ts);
};

const SectionDivider = () => (
  <div className="border-border-default w-full border-t border-dashed" />
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-secondary font-mono text-xs font-medium uppercase tracking-wider">
    {children}
  </span>
);

export const ActivityFeedFiltersDrawer = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onClearFilters,
}: ActivityFeedFiltersDrawerProps) => {
  const [localFilters, setLocalFilters] =
    useState<FeedEventsQueryParams>(filters);

  const handleSortOrderChange = (orderDirection: OrderDirection) => {
    setLocalFilters((prev) => ({ ...prev, orderDirection }));
  };

  const handleRelevanceChange = (relevance: FeedRelevance) => {
    setLocalFilters((prev) => ({ ...prev, relevance }));
  };

  const handleTypeChange = (type: FeedEventType | undefined) => {
    setLocalFilters((prev) => ({ ...prev, type }));
  };

  const handleFromDateChange = (value: number | undefined) => {
    if (value === undefined) {
      setLocalFilters((prev) => ({ ...prev, fromDate: undefined }));
      return;
    }

    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    setLocalFilters((prev) => ({ ...prev, fromDate: d.getTime() }));
  };

  const handleToDateChange = (value: number | undefined) => {
    if (value === undefined) {
      setLocalFilters((prev) => ({ ...prev, toDate: undefined }));
      return;
    }

    const d = new Date(value);
    d.setHours(23, 59, 59, 999);
    setLocalFilters((prev) => ({ ...prev, toDate: d.getTime() }));
  };

  const handleApply = () => {
    onApplyFilters({
      ...localFilters,
      fromDate: localFilters.fromDate
        ? Math.floor(localFilters.fromDate / 1000)
        : undefined,
      toDate: localFilters.toDate
        ? Math.floor(localFilters.toDate / 1000)
        : undefined,
    });
    onClose();
  };

  const handleClear = () => {
    onClearFilters();
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  useEffect(() => {
    if (isOpen)
      setLocalFilters({
        ...filters,
        fromDate: filters.fromDate ? filters.fromDate * 1000 : undefined,
        toDate: filters.toDate ? filters.toDate * 1000 : undefined,
      });
  }, [isOpen, filters]);

  return (
    <DrawerRoot open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader title="Filter Activity" onClose={onClose} />
        <div className="bg-surface-default flex h-full flex-col overflow-y-auto">
          {/* Content */}
          <div className="flex flex-1 flex-col gap-6 px-4 py-6">
            {/* Sort by Date */}
            <div className="flex flex-col gap-3">
              <SectionLabel>Sort by Date</SectionLabel>
              <div className="flex items-center gap-6">
                <RadioButton
                  label="Newest first"
                  checked={localFilters.orderDirection === "desc"}
                  onChange={() => handleSortOrderChange("desc")}
                  name="orderDirection"
                />
                <RadioButton
                  label="Oldest first"
                  checked={localFilters.orderDirection === "asc"}
                  onChange={() => handleSortOrderChange("asc")}
                  name="orderDirection"
                />
              </div>
            </div>

            <SectionDivider />

            {/* Relevance */}
            <div className="flex flex-col gap-3">
              <SectionLabel>Min. Relevance</SectionLabel>
              <div className="flex flex-col gap-3">
                {relevanceOptions.map(({ value, label }) => (
                  <RadioButton
                    key={value}
                    label={label}
                    checked={localFilters.relevance === value}
                    onChange={() => handleRelevanceChange(value)}
                    name="relevance"
                  />
                ))}
              </div>
            </div>

            <SectionDivider />

            {/* Event Type */}
            <div className="flex flex-col gap-3">
              <SectionLabel>Event Type</SectionLabel>
              <div className="flex flex-col gap-3">
                <RadioButton
                  label="All"
                  checked={localFilters.type === undefined}
                  onChange={() => handleTypeChange(undefined)}
                  name="eventType"
                />
                {typeOptions.map(({ value, label }) => (
                  <RadioButton
                    key={value}
                    label={label}
                    checked={localFilters.type === value}
                    onChange={() => handleTypeChange(value)}
                    name="eventType"
                  />
                ))}
              </div>
            </div>

            <SectionDivider />

            {/* Time Frame */}
            <div className="flex flex-col gap-3">
              <SectionLabel>Time Frame</SectionLabel>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "border-border-default bg-surface-default text-secondary hover:bg-surface-default h-9 flex-1 justify-start px-3 text-sm font-normal",
                        !localFilters.fromDate && "text-dimmed",
                      )}
                    >
                      <CalendarIcon className="text-dimmed size-4 shrink-0" />
                      {localFilters.fromDate
                        ? format(
                            timestampToDate(localFilters.fromDate)!,
                            "MMM d, yyyy",
                          )
                        : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-[200] w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={timestampToDate(localFilters.fromDate)}
                      onSelect={(date) => handleFromDateChange(date?.getTime())}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-dimmed">–</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "border-border-default bg-surface-default text-secondary hover:bg-surface-default h-9 flex-1 justify-start px-3 text-sm font-normal",
                        !localFilters.toDate && "text-dimmed",
                      )}
                    >
                      <CalendarIcon className="text-dimmed size-4 shrink-0" />
                      {localFilters.toDate
                        ? format(
                            timestampToDate(localFilters.toDate)!,
                            "MMM d, yyyy",
                          )
                        : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-[200] w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={timestampToDate(localFilters.toDate)}
                      onSelect={(date) => handleToDateChange(date?.getTime())}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {/* Spacer for fixed footer on mobile */}
            <div className="h-[72px] w-full lg:hidden" />
          </div>

          {/* Footer */}
          <div className="bg-surface-contrast fixed bottom-0 left-0 right-0 flex gap-3 px-4 py-4 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:mt-auto">
            <Button variant="primary" onClick={handleApply}>
              Apply filters
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear filters
            </Button>
          </div>
        </div>
      </DrawerContent>
    </DrawerRoot>
  );
};
