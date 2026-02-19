"use client";

import { useState } from "react";
import { Calendar, X } from "lucide-react";
import { cn } from "@/shared/utils";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from "@/shared/components/ui/drawer";
import { Checkbox } from "@/shared/components/design-system/form/fields/checkbox/Checkbox";
import { RadioButton } from "@/shared/components/design-system/buttons/RadioButton";
import { Button, IconButton } from "@/shared/components";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { useScreenSize } from "@/shared/hooks";
import {
  // FeedEventType,
  // FeedEventRelevance,
  ActivityFeedFilterState,
} from "@/features/feed/types";

interface ActivityFeedFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ActivityFeedFilterState;
  onApplyFilters: (filters: ActivityFeedFilterState) => void;
}

// const eventTypes: { value: FeedEventType; label: string }[] = [
//   { value: "delegation", label: "Delegation" },
//   { value: "transfer", label: "Transfer" },
//   { value: "vote", label: "Vote" },
//   { value: "proposal", label: "Proposal Creation" },
// ];

// const relevances: { value: FeedEventRelevance; label: string }[] = [
//   { value: "high", label: "High" },
//   { value: "medium", label: "Medium" },
//   { value: "low", label: "Low" },
// ];

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

  // const handleTypeToggle = (type: FeedEventType) => {
  //   setLocalFilters((prev) => ({
  //     ...prev,
  //     types: prev.types.includes(type)
  //       ? prev.types.filter((t) => t !== type)
  //       : [...prev.types, type],
  //   }));
  // };

  // const handleRelevanceToggle = (relevance: FeedEventRelevance) => {
  //   setLocalFilters((prev) => ({
  //     ...prev,
  //     relevances: prev.relevances.includes(relevance)
  //       ? prev.relevances.filter((r) => r !== relevance)
  //       : [...prev.relevances, relevance],
  //   }));
  // };

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
      // types: [],
      // relevances: [],
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

  // Sync local state when drawer opens
  const handleDrawerOpen = () => {
    setLocalFilters(filters);
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={handleOpenChange}
      direction={isMobile ? "bottom" : "right"}
      onAnimationEnd={(open) => {
        if (open) handleDrawerOpen();
      }}
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

            {/* Type */}
            {/* <div className="flex flex-col gap-3">
              <SectionLabel>Type</SectionLabel>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {eventTypes.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Checkbox
                      checked={localFilters.types.includes(value)}
                      onCheckedChange={() => handleTypeToggle(value)}
                    />
                    <span
                      className={cn(
                        "text-sm transition-colors",
                        localFilters.types.includes(value)
                          ? "text-primary"
                          : "text-secondary",
                      )}
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div> */}

            <SectionDivider />

            {/* Relevance */}
            {/* <div className="flex flex-col gap-3">
              <SectionLabel>Relevance</SectionLabel>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {relevances.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Checkbox
                      checked={localFilters.relevances.includes(value)}
                      onCheckedChange={() => handleRelevanceToggle(value)}
                    />
                    <span
                      className={cn(
                        "text-sm transition-colors",
                        localFilters.relevances.includes(value)
                          ? "text-primary"
                          : "text-secondary",
                      )}
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div> */}

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
          </div>

          {/* Footer */}
          <div className="bg-surface-contrast mt-auto flex gap-3 px-4 py-4">
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
