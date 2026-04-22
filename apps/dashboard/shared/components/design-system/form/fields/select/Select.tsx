"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { useState } from "react";

import type { SelectProps } from "@/shared/components/design-system/form/fields/select/types";
import { cn } from "@/shared/utils/cn";

/**
 * Select — a form field dropdown for choosing a single value from a list.
 * Follows the same visual language as Input and Textarea (bg-surface-default,
 * border-border-contrast) and supports disabled and error states.
 *
 * Built on Radix UI Popover for accessibility and keyboard navigation.
 */
export const Select = ({
  items,
  value,
  placeholder = "Select…",
  onValueChange,
  disabled = false,
  error = false,
  className,
}: SelectProps) => {
  const [open, setOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);

  const selectedItem = items.find((item) => item.value === value);

  const handleSelect = (itemValue: string) => {
    onValueChange?.(itemValue);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (disabled && nextOpen) return;
        setOpen(nextOpen);
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            // Base/layout
            "flex w-full items-center gap-2.5",
            // Sizing — matches Input height (h-9 = 36px) and padding
            "h-9 px-2.5 py-2",
            // Typography
            "text-sm font-normal leading-5",
            // Colors/surfaces — matches Input: bg-surface-default, border-border-contrast
            "bg-surface-default border-border-contrast rounded-base border",
            // Transitions
            "transition-all duration-200",
            // Hover (suppressed when disabled)
            !disabled && "hover:bg-surface-contrast",
            // Open/focused state — focus ring matching Input focus style
            open && "border-border-contrast shadow-[var(--shadow-focus-ring)]",
            // Error state
            error && "border-error",
            // Disabled state
            disabled &&
              "bg-surface-disabled border-border-default cursor-not-allowed opacity-50",
            // Cursor
            !disabled && "cursor-pointer",
            className,
          )}
        >
          {/* Label — fills remaining space */}
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedItem ? (
              <span className="text-primary">{selectedItem.label}</span>
            ) : (
              <span className="text-dimmed">{placeholder}</span>
            )}
          </span>

          {/* Trailing chevron */}
          <ChevronDownIcon
            className={cn(
              "text-secondary size-3.5 shrink-0 transition-transform duration-150",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Content
        role="listbox"
        align="start"
        sideOffset={4}
        // Match trigger width
        style={{ width: "var(--radix-popover-trigger-width)" }}
        className={cn(
          // Base/layout
          "flex flex-col",
          // Padding around items
          "py-1",
          // Colors/surfaces
          "bg-surface-default",
          // Border
          "rounded-base border-border-contrast border",
          // Z-index
          "z-50",
          // Animation
          "animate-[popover-slide-in_0.15s_ease-out]",
        )}
      >
        {items.map((item) => {
          const isSelected = item.value === value;
          const isHovered = hoveredValue === item.value;

          return (
            <button
              key={item.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect(item.value)}
              onMouseEnter={() => setHoveredValue(item.value)}
              onMouseLeave={() => setHoveredValue(null)}
              className={cn(
                // Base/layout
                "flex w-full items-center gap-1.5",
                // Sizing
                "px-2.5 py-2",
                // Typography
                "text-sm font-normal leading-5",
                // Colors
                "text-primary",
                // Background: hover or selected+hover → surface-hover, selected → surface-contrast, default → transparent
                isSelected && isHovered && "bg-surface-hover",
                isSelected && !isHovered && "bg-surface-contrast",
                !isSelected && isHovered && "bg-surface-hover",
                !isSelected && !isHovered && "bg-transparent",
                // Transitions
                "transition-colors duration-150",
                // Interactive
                "cursor-pointer",
              )}
            >
              {/* Label — fills remaining space */}
              <span className="min-w-0 flex-1 truncate text-left">
                {item.label}
              </span>

              {/* Trailing check icon — shown when item is selected */}
              {isSelected && (
                <CheckIcon
                  className="text-primary size-3.5 shrink-0"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
};
