"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { ComboboxItem } from "@/shared/components/design-system/combobox/combobox-item/ComboboxItem";
import type { ComboboxProps } from "@/shared/components/design-system/combobox/types";
import { cn } from "@/shared/utils/cn";

/**
 * Combobox — a trigger button that opens a dropdown list of selectable items.
 * Handles selection state, keyboard navigation (via Radix Popover), and accessibility.
 *
 * Use this component; never reach for ComboboxItem directly.
 */
export const Combobox = ({
  items,
  value,
  placeholder = "Select…",
  onValueChange,
  disabled = false,
  className,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);

  const selectedItem = items.find((item) => item.value === value);

  const handleSelect = (itemValue: string) => {
    onValueChange?.(itemValue);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            // Base/layout
            "flex items-center gap-1.5",
            // Sizing — px-3 (12px) py-2 (8px) matching item padding
            "px-3 py-2",
            // Typography
            "text-sm font-normal leading-5",
            // Colors/surfaces
            "text-primary bg-surface-contrast",
            // Border
            "border-border-contrast border",
            // Transitions
            "transition-colors duration-150",
            // Hover
            "hover:bg-surface-hover",
            // Disabled
            disabled && "pointer-events-none opacity-50",
            // Cursor
            "cursor-pointer",
            // Min width from Figma (128px)
            "min-w-32",
            // Allow overrides
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedItem ? (
              selectedItem.label
            ) : (
              <span className="text-dimmed">{placeholder}</span>
            )}
          </span>
          <ChevronDownIcon
            className={cn(
              "text-secondary shrink-0 transition-transform duration-150",
              open && "rotate-180",
            )}
            style={{ width: 14, height: 14 }}
            aria-hidden="true"
          />
        </button>
      </PopoverPrimitive.Trigger>

      {/* Dropdown content */}
      <PopoverPrimitive.Content
        role="listbox"
        align="start"
        sideOffset={4}
        className={cn(
          // Base/layout
          "flex flex-col",
          // Sizing — min-w from Figma (128px), py-1 (4px) padding from blocks/padding-xs
          "min-w-32 py-1",
          // Colors/surfaces
          "bg-surface-contrast",
          // Border
          "border-border-contrast border",
          // Z-index
          "z-50",
          // Animation
          "animate-[popover-slide-in_0.15s_ease-out]",
        )}
      >
        {items.map((item) => {
          const isSelected = item.value === value;
          const isHovered = hoveredValue === item.value;

          let status: "default" | "hover" | "active" | "filter" = "default";
          if (isSelected && isHovered) {
            status = "filter";
          } else if (isSelected) {
            status = "active";
          } else if (isHovered) {
            status = "hover";
          }

          return (
            <ComboboxItem
              key={item.value}
              label={item.label}
              hasIcon={!!item.icon}
              icon={item.icon}
              status={status}
              isSelected={isSelected}
              onClick={() => handleSelect(item.value)}
              onMouseEnter={() => setHoveredValue(item.value)}
              onMouseLeave={() => setHoveredValue(null)}
            />
          );
        })}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
};
