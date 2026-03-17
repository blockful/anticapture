import type { Meta, StoryObj } from "@storybook/nextjs";

import { DrawerBody } from "@/shared/components/design-system/drawer/drawer-body/DrawerBody";
import type { DrawerBodyProps } from "@/shared/components/design-system/drawer/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<DrawerBodyProps> = {
  title: "Design System/Drawer/DrawerBody",
  component: DrawerBody,
  parameters: {
    layout: "padded",
    design: getFigmaDesignConfigByNodeId("22016-174"),
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: false,
      description: "Body content",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<DrawerBodyProps>;

export const Default: Story = {
  args: {
    children: (
      <div className="text-secondary flex items-center justify-center p-5 text-sm">
        Place the content here
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="bg-surface-default flex h-64 w-full max-w-2xl flex-col">
        <Story />
      </div>
    ),
  ],
};

export const AllStates = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <span className="text-secondary mb-2 block text-xs">Default</span>
        <div className="bg-surface-default flex h-48 w-full max-w-2xl flex-col">
          <DrawerBody>
            <div className="text-secondary flex h-full items-center justify-center p-5 text-sm">
              Default body with overflow hidden
            </div>
          </DrawerBody>
        </div>
      </div>
      <div>
        <span className="text-secondary mb-2 block text-xs">
          With scrollable content
        </span>
        <div className="bg-surface-default flex h-48 w-full max-w-2xl flex-col">
          <DrawerBody className="overflow-y-auto">
            <div className="text-secondary space-y-4 p-5 text-sm">
              {Array.from({ length: 10 }).map((_, i) => (
                <p key={i}>Scrollable content row {i + 1}</p>
              ))}
            </div>
          </DrawerBody>
        </div>
      </div>
    </div>
  ),
};
