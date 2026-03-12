import type { Meta, StoryObj } from "@storybook/nextjs";
import { CrownIcon } from "lucide-react";

import { ComboboxItem } from "@/shared/components/design-system/combobox/combobox-item/ComboboxItem";
import type { ComboboxItemProps } from "@/shared/components/design-system/combobox/types";

type ComboboxItemStoryArgs = ComboboxItemProps & { showIcon?: boolean };

const meta: Meta<ComboboxItemStoryArgs> = {
  title: "Design System/Combobox/ComboboxItem",
  component: ComboboxItem,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=7459-19867",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Item label text",
    },
    hasIcon: {
      control: "boolean",
      description: "Whether to render the leading icon slot",
    },
    status: {
      control: "select",
      options: ["default", "hover", "active", "filter"],
      description: "Visual state of the item",
    },
    isSelected: {
      control: "boolean",
      description: "Whether the item is selected (shows check icon)",
    },
    disabled: {
      control: "boolean",
      description: "Disabled state",
    },
    showIcon: {
      control: "boolean",
      description: "Toggle leading icon on all states",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<ComboboxItemStoryArgs>;

export const Default: Story = {
  args: {
    label: "Overview",
    hasIcon: false,
    status: "default",
    isSelected: false,
    disabled: false,
  },
};

export const AllStates: Story = {
  args: {
    showIcon: false,
  },
  render: ({ showIcon }) => {
    const icon = showIcon ? (
      <CrownIcon style={{ width: 14, height: 14 }} className="text-highlight" />
    ) : undefined;

    return (
      <div className="flex w-[244px] flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-secondary mb-1 text-xs">Default</span>
          <ComboboxItem
            label="Overview"
            status="default"
            hasIcon={showIcon}
            icon={icon}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-secondary mb-1 text-xs">Hover</span>
          <ComboboxItem
            label="Delegates"
            status="hover"
            hasIcon={showIcon}
            icon={icon}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-secondary mb-1 text-xs">Active (selected)</span>
          <ComboboxItem
            label="Proposals"
            status="active"
            isSelected
            hasIcon={showIcon}
            icon={icon}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-secondary mb-1 text-xs">
            Filter (selected, filtered)
          </span>
          <ComboboxItem
            label="Analytics"
            status="filter"
            isSelected
            hasIcon={showIcon}
            icon={icon}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-secondary mb-1 text-xs">Disabled</span>
          <ComboboxItem
            label="Treasury"
            disabled
            hasIcon={showIcon}
            icon={icon}
          />
        </div>
      </div>
    );
  },
} satisfies Story;
