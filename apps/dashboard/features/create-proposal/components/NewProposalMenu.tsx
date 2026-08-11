"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { itemStatusStyles } from "@/shared/components/design-system/combobox/styles";
import { cn } from "@/shared/utils/cn";

type DataProps = Partial<Record<`data-${string}`, string | undefined>>;

type NewProposalMenuProps = {
  onCreateNew: () => void;
  onImportJson: () => void;
  // Analytics tags live on the items, not the trigger: tagging the trigger
  // would fire the event on merely opening the menu.
  createNewProps?: DataProps;
  importJsonProps?: DataProps;
};

const MenuItem = ({
  label,
  onSelect,
  ...rest
}: {
  label: string;
  onSelect: () => void;
} & DataProps) => (
  <button
    type="button"
    role="menuitem"
    onClick={onSelect}
    {...rest}
    className={cn(
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
  createNewProps,
  importJsonProps,
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
          className="flex-1 whitespace-nowrap lg:w-fit lg:flex-none"
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
          "min-w-40 py-1",
          "bg-surface-contrast",
          "border-border-contrast rounded-base border",
          "z-50",
          "animate-[popover-slide-in_0.15s_ease-out]",
        )}
      >
        <MenuItem
          label="Create new"
          onSelect={choose(onCreateNew)}
          {...createNewProps}
        />
        <MenuItem
          label="Import JSON"
          onSelect={choose(onImportJson)}
          {...importJsonProps}
        />
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
};
