import type { Meta, StoryObj } from "@storybook/nextjs";

import { Textarea } from "@/shared/components/design-system/form/fields/textarea/Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Design System/Form/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    disabled: {
      control: "boolean",
      description: "Whether the textarea is disabled",
    },
    error: {
      control: "boolean",
      description: "Whether the textarea has an error state",
    },
    rows: {
      control: "number",
      description: "Number of visible text lines",
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
    placeholder: "Enter your message...",
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
    placeholder: "Disabled textarea",
    disabled: true,
  },
};

export const Error: Story = {
  args: {
    placeholder: "Error state",
    error: true,
  },
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-1">
      <Textarea placeholder="Type the text..." />
      <p className="text-secondary text-xs">
        Please share any additional comments. We appreciate your input and may
        follow up if we need more details.
      </p>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-sm">Default</label>
        <Textarea placeholder="Default state" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-sm">With Value</label>
        <Textarea defaultValue="Filled textarea content" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-sm">Disabled</label>
        <Textarea placeholder="Disabled state" disabled />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-secondary text-sm">Error</label>
        <Textarea placeholder="Error state" error />
      </div>
    </div>
  ),
};
