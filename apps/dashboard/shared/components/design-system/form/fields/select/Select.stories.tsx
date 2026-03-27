"use client";

import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";

import { Select } from "@/shared/components/design-system/form/fields/select/Select";
import type { SelectProps } from "@/shared/components/design-system/form/fields/select/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const defaultItems = [
  { value: "overview", label: "Overview" },
  { value: "delegates", label: "Delegates" },
  { value: "proposals", label: "Proposals" },
  { value: "treasury", label: "Treasury" },
];

const meta: Meta<SelectProps> = {
  title: "Data Entry/Form/Select",
  component: Select,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("20768-32769"),
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text shown when no item is selected",
    },
    disabled: {
      control: "boolean",
      description: "Disabled state",
    },
    error: {
      control: "boolean",
      description: "Error state — renders border-error",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<SelectProps>;

export const Default: Story = {
  args: {
    placeholder: "Select…",
    disabled: false,
    error: false,
    items: defaultItems,
  },
};

export const AllStates: Story = {
  args: {
    items: defaultItems,
    placeholder: "Select…",
  },
  render: () => (
    <div className="flex w-64 flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-secondary text-xs">Default (placeholder)</span>
        <Select items={defaultItems} placeholder="Select…" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-secondary text-xs">Selected value</span>
        <Select items={defaultItems} value="delegates" placeholder="Select…" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-secondary text-xs">Error</span>
        <Select items={defaultItems} placeholder="Select…" error />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-secondary text-xs">Disabled (placeholder)</span>
        <Select items={defaultItems} placeholder="Select…" disabled />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-secondary text-xs">Disabled (selected)</span>
        <Select
          items={defaultItems}
          value="proposals"
          placeholder="Select…"
          disabled
        />
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    items: defaultItems,
    placeholder: "Select…",
  },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selected, setSelected] = useState<string | undefined>(undefined);

    return (
      <div className="flex w-64 flex-col items-start gap-4">
        <Select
          items={defaultItems}
          value={selected}
          placeholder="Select an option…"
          onValueChange={setSelected}
        />
        <span className="text-secondary text-xs">
          Selected: {selected ?? "none"}
        </span>
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    items: defaultItems,
    value: "overview",
    placeholder: "Select…",
    disabled: true,
  },
};

export const ErrorState: Story = {
  args: {
    items: defaultItems,
    placeholder: "Select…",
    error: true,
  },
};
