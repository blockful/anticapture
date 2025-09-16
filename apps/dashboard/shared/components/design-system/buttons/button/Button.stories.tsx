import { Plus } from "lucide-react";
import { Button } from "@/shared/components/design-system/buttons/button/Button";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Design System/Buttons/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "Button text",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Button size: sm, md, lg",
    },
    variant: {
      control: "select",
      options: ["primary", "outline", "ghost", "destructive"],
      description: "Button variant",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "primary",
    children: "Button",
  },
};
export const Disabled: Story = {
  args: {
    variant: "primary",
    children: "Button",
    disabled: true,
  },
};

export const WithIcon: Story = {
  render: () => (
    <Button>
      <Plus className="size-4" />
      Button
    </Button>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <Button loading={true}>Button</Button>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button loading={true} loadingText="Building...">
          Button
        </Button>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <Button size="sm">Button</Button>
        <span className="text-xs text-gray-400">SM</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button>Button</Button>
        <span className="text-xs text-gray-400">MD</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button size="lg">Button</Button>
        <span className="text-xs text-gray-400">LG</span>
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <Button variant="primary">Button</Button>
        <span className="text-xs text-gray-400">Primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button variant="outline">Button</Button>
        <span className="text-xs text-gray-400">Outline</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button variant="ghost">Button</Button>
        <span className="text-xs text-gray-400">Ghost</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button variant="destructive">Button</Button>
        <span className="text-xs text-gray-400">Destructive</span>
      </div>
    </div>
  ),
};

export const WithCustomStyling: Story = {
  args: {
    className:
      "border-2 border-blue-500 shadow-lg bg-blue-600 hover:bg-blue-700",
    children: "Custom Button",
  },
};
