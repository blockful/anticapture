import type { Meta, StoryObj } from "@storybook/react";
import { Toast } from "./Toast";

const meta: Meta<typeof Toast> = {
  title: "Design System/Toast",
  component: Toast,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["success", "error"],
    },
    visible: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Success: Story = {
  args: {
    message: "Vote submitted successfully!",
    type: "success",
    visible: true,
    onClose: () => console.log("Toast closed"),
  },
};

export const Error: Story = {
  args: {
    message: "Failed to vote. Please try again.",
    type: "error",
    visible: true,
    onClose: () => console.log("Toast closed"),
  },
};

export const LongMessage: Story = {
  args: {
    message:
      "Your vote has been submitted successfully and will be reflected in the proposal shortly.",
    type: "success",
    visible: true,
    onClose: () => console.log("Toast closed"),
  },
};
