import { Search } from "lucide-react";
import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Design System/Buttons/IconButton",
  component: IconButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    icon: { control: false },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "IconButton size: sm, md, lg",
    },
    variant: {
      control: "select",
      options: ["primary", "outline", "ghost", "destructive"],
      description: "IconButton variant",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "primary",
    icon: Search,
  },
};
export const Disabled: Story = {
  args: {
    variant: "primary",
    icon: Search,
    disabled: true,
  },
};

export const WithIcon: Story = {
  args: {
    variant: "primary",
    icon: Search,
  },
  render: (args) => <IconButton {...args} />,
};

export const Loading: Story = {
  args: {
    icon: Search,
    loading: true,
  },
  render: (args) => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <IconButton {...args} />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  args: {
    icon: Search,
  },
  render: (args) => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <IconButton {...args} size="sm" />
        <span className="text-xs text-gray-400">SM</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconButton {...args} size="md" />
        <span className="text-xs text-gray-400">MD</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconButton {...args} size="lg" />
        <span className="text-xs text-gray-400">LG</span>
      </div>
    </div>
  ),
};

export const Variants: Story = {
  args: {
    icon: Search,
  },
  render: (args) => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <IconButton {...args} variant="primary" />
        <span className="text-xs text-gray-400">Primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconButton {...args} variant="outline" />
        <span className="text-xs text-gray-400">Outline</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconButton {...args} variant="ghost" />
        <span className="text-xs text-gray-400">Ghost</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconButton {...args} variant="destructive" />
        <span className="text-xs text-gray-400">Destructive</span>
      </div>
    </div>
  ),
};

export const WithCustomStyling: Story = {
  args: {
    className:
      "border-2 border-blue-500 shadow-lg bg-blue-600 hover:bg-blue-700",
    icon: Search,
  },
};
