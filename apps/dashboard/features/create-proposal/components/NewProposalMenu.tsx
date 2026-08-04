"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { itemStatusStyles } from "@/shared/components/design-system/combobox/styles";
import { cn } from "@/shared/utils/cn";

/**
 * The two ways to start a proposal, behind the New Proposal button.
 *
 * The import used to be a button sitting on the creation form, which is one step
 * too late: by then the author has an empty form in front of them and importing
 * replaces what they are looking at. Choosing it here makes it a way of starting,
 * which is what it is.
 *
 * Built on the Popover primitive rather than the Combobox, which is a select: it
 * shows its current value in the trigger, and these two options are actions with
 * nothing selected between them. The item styling is borrowed from the combobox
 * so the two menus look like one system.
 */

type NewProposalMenuProps = {
  onCreateNew: () => void;
  onImportJson: () => void;
  /**
   * Forwarded to the trigger, which is where the analytics attributes live.
   *
   * `data-*` keys are spelled out because JSX accepts them on an element without
   * being declared, but an object literal assigned to a typed prop does not.
   */
  triggerProps?: React.ComponentProps<typeof Button> &
    Partial<Record<`data-${string}`, string | undefined>>;
};

/** Just the label. Two options this plain need nothing explaining them. */
const MenuItem = ({
  label,
  onSelect,
}: {
  label: string;
  onSelect: () => void;
}) => (
  <button
    type="button"
    role="menuitem"
    onClick={onSelect}
    className={cn(
      // The same padding and type as a combobox item, so the two menus in the
      // app read as one system.
      "flex w-full items-center px-3 py-2 text-left",
      "text-primary text-sm font-normal leading-5",
      itemStatusStyles.default,
      "hover:bg-surface-hover cursor-pointer transition-colors duration-150",
    )}
  >
    {label}
  </button>
);

export const NewProposalMenu = ({
  onCreateNew,
  onImportJson,
  triggerProps,
}: NewProposalMenuProps) => {
  const [open, setOpen] = useState(false);

  const choose = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="primary"
          size="md"
          aria-haspopup="menu"
          aria-expanded={open}
          {...triggerProps}
          className={cn(
            "flex-1 whitespace-nowrap lg:w-fit lg:flex-none",
            triggerProps?.className,
          )}
        >
          <Plus className="size-4" />
          New Proposal
        </Button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Content
        role="menu"
        align="end"
        sideOffset={4}
        className={cn(
          "flex flex-col",
          // Sized to the labels now that nothing sits under them. Wide enough
          // that the two rows don't look cramped against the trigger above.
          "min-w-40 py-1",
          "bg-surface-contrast",
          "border-border-contrast rounded-base border",
          "z-50",
          "animate-[popover-slide-in_0.15s_ease-out]",
        )}
      >
        <MenuItem label="Create new" onSelect={choose(onCreateNew)} />
        <MenuItem label="Import JSON" onSelect={choose(onImportJson)} />
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
};
