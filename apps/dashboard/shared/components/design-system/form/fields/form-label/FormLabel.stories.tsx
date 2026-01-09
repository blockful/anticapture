import type { Meta, StoryObj } from "@storybook/nextjs";

import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";

const meta: Meta<typeof FormLabel> = {
  title: "Design System/Form/FormLabel",
  component: FormLabel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "The label text",
    },
    isRequired: {
      control: "boolean",
      description: "Shows a red asterisk after the label",
    },
    isOptional: {
      control: "boolean",
      description: 'Shows "(Optional)" after the label',
    },
    htmlFor: {
      control: "text",
      description: "The ID of the form element the label is associated with",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Label",
  },
};

export const Required: Story = {
  args: {
    children: "Label",
    isRequired: true,
  },
};

export const Optional: Story = {
  args: {
    children: "Label",
    isOptional: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <FormLabel isRequired>Label</FormLabel>
      <FormLabel isOptional>Label</FormLabel>
      <FormLabel>Label</FormLabel>
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormLabel isRequired>Email Address</FormLabel>
      <FormLabel isOptional>Phone Number</FormLabel>
      <FormLabel>Description</FormLabel>
    </div>
  ),
};
