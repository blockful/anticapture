import type { Meta, StoryObj } from "@storybook/nextjs";

import { BulletDivider } from "@/shared/components/design-system/section/bullet-divider/BulletDivider";
import type { BulletDividerProps } from "@/shared/components/design-system/section/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<BulletDividerProps> = {
  title: "Layout/Sections/BulletDivider",
  component: BulletDivider,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("11304-19660"),
  },
  tags: ["autodocs"],
  argTypes: {
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<BulletDividerProps>;

export const Default: Story = {
  args: {},
};

export const AllStates = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-secondary mb-2 block text-xs">Default</span>
        <BulletDivider />
      </div>
      <div>
        <span className="text-secondary mb-2 block text-xs">
          In context (inline between text items)
        </span>
        <div className="text-secondary flex items-center gap-2 text-sm">
          <span>Overview</span>
          <BulletDivider />
          <span>Jan 1 – Dec 31, 2024</span>
          <BulletDivider />
          <span>1,234 members</span>
        </div>
      </div>
    </div>
  ),
};
