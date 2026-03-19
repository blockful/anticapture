"use client";

import type { Meta, StoryObj } from "@storybook/nextjs";
import { CrownIcon, StarIcon, ZapIcon } from "lucide-react";
import { useState } from "react";

import { Combobox } from "@/shared/components/design-system/combobox/Combobox";
import type { ComboboxProps } from "@/shared/components/design-system/combobox/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

type ComboboxStoryArgs = ComboboxProps & { showIcon?: boolean };

const meta: Meta<ComboboxStoryArgs> = {
  title: "Data Entry/Combobox/Combobox",
  component: Combobox,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("11197-22067"),
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text when no item is selected",
    },
    isDisabled: {
      control: "boolean",
      description: "Disabled state",
    },
    showIcon: {
      control: "boolean",
      description: "Toggle icon items vs plain items",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<ComboboxStoryArgs>;

const basicItems = [
  { value: "overview", label: "Overview" },
  { value: "delegates", label: "Delegates" },
  { value: "proposals", label: "Proposals" },
];

const iconItems = [
  {
    value: "uniswap",
    label: "Uniswap",
    icon: <CrownIcon className="text-highlight size-3.5" />,
  },
  {
    value: "ens",
    label: "ENS",
    icon: <StarIcon className="text-highlight size-3.5" />,
  },
  {
    value: "optimism",
    label: "Optimism",
    icon: <ZapIcon className="text-highlight size-3.5" />,
  },
];

export const Default: Story = {
  args: {
    placeholder: "Select…",
    isDisabled: false,
    showIcon: false,
  },
  render: ({ placeholder, isDisabled, showIcon }) => (
    <Combobox
      items={showIcon ? iconItems : basicItems}
      placeholder={placeholder ?? "Select…"}
      isDisabled={isDisabled}
    />
  ),
};

export const WithPreselection: Story = {
  args: {
    showIcon: false,
  },
  render: ({ showIcon }) => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-secondary text-xs">Preselected — no icon</span>
        <Combobox items={basicItems} value="delegates" placeholder="Select…" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-secondary text-xs">Preselected — with icon</span>
        <Combobox
          items={iconItems}
          value={showIcon ? "ens" : "delegates"}
          placeholder="Select DAO…"
        />
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    items: basicItems,
    value: "overview",
    isDisabled: true,
    placeholder: "Select…",
  },
};

export const Interactive: Story = {
  args: {
    showIcon: false,
  },
  render: ({ showIcon }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selected, setSelected] = useState<string | undefined>(undefined);
    const items = showIcon ? iconItems : basicItems;
    const placeholder = showIcon ? "Select DAO…" : "Select an item…";

    return (
      <div className="flex flex-col items-start gap-4">
        <Combobox
          items={items}
          value={selected}
          placeholder={placeholder}
          onValueChange={setSelected}
        />
        <span className="text-secondary text-xs">
          Selected: {selected ?? "none"}
        </span>
      </div>
    );
  },
};
