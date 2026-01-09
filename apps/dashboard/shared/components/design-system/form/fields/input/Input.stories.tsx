import type { Meta, StoryObj } from "@storybook/nextjs";

import { Input } from "@/shared/components/design-system/form/fields/input/Input";

const meta: Meta<typeof Input> = {
  title: "Design System/Form/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "url", "tel"],
      description: "Input type",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
    error: {
      control: "boolean",
      description: "Whether the input is in an error state",
    },
    hasIcon: {
      control: "boolean",
      description: "Whether to show a search icon",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
    type: "text",
  },
};

export const Hover: Story = {
  parameters: {
    pseudo: { hover: true },
  },
  args: {
    placeholder: "Hover state",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
    type: "text",
  },
};

export const Error: Story = {
  args: {
    placeholder: "Error state",
    error: true,
  },
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-sm">Default</label>
        <Input placeholder="Default state" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-sm">With Value</label>
        <Input defaultValue="Filled input" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-sm">Disabled</label>
        <Input placeholder="Disabled state" disabled />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-sm">Error</label>
        <Input placeholder="Error state" error />
      </div>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-1">
      <Input placeholder="Type the text..." />
      <p className="text-secondary text-xs">
        Please share any additional comments. We appreciate your input and may
        follow up if we need more details.
      </p>
    </div>
  ),
};

export const Types: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-sm">Text</label>
        <Input type="text" placeholder="Enter text..." />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-sm">Email</label>
        <Input type="email" placeholder="user@example.com" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-sm">Password</label>
        <Input type="password" placeholder="Enter password" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-sm">Number</label>
        <Input type="number" placeholder="0" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-sm">Search</label>
        <Input type="search" placeholder="Search..." hasIcon />
      </div>
    </div>
  ),
};
