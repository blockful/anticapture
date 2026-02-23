"use client";

import { Calendar, X } from "lucide-react";
import { useState, useEffect } from "react";

import {
  FeedEventRelevance,
  FeedEventType,
  ActivityFeedFilterState,
} from "@/features/feed/types";
import { Button, IconButton } from "@/shared/components";
import { RadioButton } from "@/shared/components/design-system/buttons/RadioButton";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from "@/shared/components/ui/drawer";
import { useScreenSize } from "@/shared/hooks";

interface ActivityFeedFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ActivityFeedFilterState;
  onApplyFilters: (filters: ActivityFeedFilterState) => void;
}

const relevanceOptions: { value: FeedEventRelevance; label: string }[] = [
  { value: FeedEventRelevance.Low, label: "Low" },
  { value: FeedEventRelevance.Medium, label: "Medium" },
  { value: FeedEventRelevance.High, label: "High" },
];

const typeOptions: { value: FeedEventType; label: string }[] = [
  { value: FeedEventType.Vote, label: "Vote" },
  { value: FeedEventType.Proposal, label: "Proposal" },
  { value: FeedEventType.ProposalExtended, label: "Proposal Extended" },
  { value: FeedEventType.Transfer, label: "Transfer" },
  { value: FeedEventType.Delegation, label: "Delegation" },
];

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
}: ActivityFeedFiltersDrawerProps) => {
  const { isMobile } = useScreenSize();
  const [localFilters, setLocalFilters] =
    useState<ActivityFeedFilterState>(filters);

  const handleSortOrderChange = (sortOrder: "desc" | "asc") => {
    setLocalFilters((prev) => ({ ...prev, sortOrder }));
  };

  const handleRelevanceChange = (relevance: FeedEventRelevance) => {
    setLocalFilters((prev) => ({ ...prev, relevance }));
  };

  const handleTypeChange = (type: FeedEventType | undefined) => {
    setLocalFilters((prev) => ({ ...prev, type }));
  };

  const handleFromDateChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, fromDate: value }));
  };

  const handleToDateChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, toDate: value }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: ActivityFeedFilterState = {
      sortOrder: "desc",
      relevance: FeedEventRelevance.Medium,
      type: undefined,
      fromDate: "",
      toDate: "",
    };
    setLocalFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) setLocalFilters(filters);
  }, [isOpen, filters]);

  return (
    <Drawer
      open={isOpen}
      onOpenChange={handleOpenChange}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerContent className="flex h-full flex-col">
        <div className="bg-surface-default flex h-full flex-col overflow-y-auto">
          {/* Header */}
          <div className="bg-surface-contrast px-4 pb-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-primary text-lg font-semibold">
                Filter Activity
              </h2>
              <DrawerClose asChild>
                <IconButton variant="outline" size="sm" icon={X} />
              </DrawerClose>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-6 px-4 py-6">
            {/* Sort by Date */}
            <div className="flex flex-col gap-3">
              <SectionLabel>Sort by Date</SectionLabel>
              <div className="flex items-center gap-6">
                <RadioButton
                  label="Newest first"
                  checked={localFilters.sortOrder === "desc"}
                  onChange={() => handleSortOrderChange("desc")}
                  name="sortOrder"
                />
                <RadioButton
                  label="Oldest first"
                  checked={localFilters.sortOrder === "asc"}
                  onChange={() => handleSortOrderChange("asc")}
                  name="sortOrder"
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
                <div className="relative flex-1">
                  <Calendar className="text-dimmed pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    type="date"
                    value={localFilters.fromDate}
                    onChange={(e) => handleFromDateChange(e.target.value)}
                    placeholder="MM/DD/YYYY"
                    className="pl-9 [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </div>
                <span className="text-dimmed">–</span>
                <div className="relative flex-1">
                  <Calendar className="text-dimmed pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    type="date"
                    value={localFilters.toDate}
                    onChange={(e) => handleToDateChange(e.target.value)}
                    placeholder="MM/DD/YYYY"
                    className="pl-9 [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </div>
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
    </Drawer>
  );
};
