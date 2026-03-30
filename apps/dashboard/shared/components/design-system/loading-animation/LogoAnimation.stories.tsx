import type { Meta, StoryObj } from "@storybook/nextjs";

import { LogoAnimation } from "@/shared/components/design-system/loading-animation/LogoAnimation";
import type { LogoAnimationProps } from "@/shared/components/design-system/loading-animation/LogoAnimation";

const meta = {
  title: "Feedback/Loading Animation/LogoAnimation",
  component: LogoAnimation,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant of the logo animation",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<LogoAnimationProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: "lg",
  },
};
