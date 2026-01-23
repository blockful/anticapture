import type { Meta, StoryObj } from "@storybook/nextjs";
import { DividerDefault } from "@/shared/design-system/divider/DividerDefault";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta = {
  title: "Design System/Dividers/DividerDefault",
  component: DividerDefault,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("10339-57793"),
  },
  tags: ["autodocs"],
  argTypes: {
    isVertical: {
      control: "boolean",
      description: "Display divider vertically",
    },
    isHorizontal: {
      control: "boolean",
      description: "Display divider horizontally (default)",
    },
  },
} satisfies Meta<typeof DividerDefault>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Horizontal: Story = {
  args: {
    isHorizontal: true,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Vertical: Story = {
  args: {
    isVertical: true,
  },
  decorators: [
    (Story) => (
      <div className="h-32">
        <Story />
      </div>
    ),
  ],
};

export const InContent: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <p className="text-primary text-sm">Section 1</p>
      <DividerDefault />
      <p className="text-primary text-sm">Section 2</p>
      <DividerDefault />
      <p className="text-primary text-sm">Section 3</p>
    </div>
  ),
};

export const InSidebar: Story = {
  render: () => (
    <div className="flex h-32 gap-4">
      <div className="space-y-2">
        <button className="text-primary hover:text-secondary text-sm">
          Home
        </button>
        <button className="text-primary hover:text-secondary text-sm">
          About
        </button>
        <button className="text-primary hover:text-secondary text-sm">
          Contact
        </button>
      </div>
      <DividerDefault isVertical />
      <div className="space-y-2">
        <p className="text-secondary text-sm">Main content area</p>
        <p className="text-tertiary text-xs">Additional information here</p>
      </div>
    </div>
  ),
};

export const MultipleVertical: Story = {
  render: () => (
    <div className="flex h-20 items-center gap-4">
      <span className="text-primary text-sm">Item 1</span>
      <DividerDefault isVertical />
      <span className="text-primary text-sm">Item 2</span>
      <DividerDefault isVertical />
      <span className="text-primary text-sm">Item 3</span>
      <DividerDefault isVertical />
      <span className="text-primary text-sm">Item 4</span>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="bg-surface-hover w-96 space-y-4 rounded-lg p-6">
      <div>
        <h3 className="text-primary text-base font-semibold">Card Title</h3>
        <p className="text-secondary text-sm">Card description text</p>
      </div>
      <DividerDefault />
      <div className="space-y-2">
        <p className="text-primary text-sm">Content section 1</p>
        <p className="text-tertiary text-xs">Additional details</p>
      </div>
      <DividerDefault />
      <div className="flex gap-2">
        <button className="bg-surface-action-primary text-inverted rounded px-3 py-1.5 text-sm">
          Action
        </button>
        <button className="text-secondary hover:text-primary px-3 py-1.5 text-sm">
          Cancel
        </button>
      </div>
    </div>
  ),
};

export const InList: Story = {
  render: () => (
    <div className="w-96 space-y-0">
      <div className="text-primary py-3 text-sm">List item 1</div>
      <DividerDefault />
      <div className="text-primary py-3 text-sm">List item 2</div>
      <DividerDefault />
      <div className="text-primary py-3 text-sm">List item 3</div>
      <DividerDefault />
      <div className="text-primary py-3 text-sm">List item 4</div>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-tertiary mb-2 text-xs">Horizontal Divider</p>
        <div className="w-96">
          <DividerDefault isHorizontal />
        </div>
      </div>

      <div>
        <p className="text-tertiary mb-2 text-xs">Vertical Divider</p>
        <div className="h-20">
          <DividerDefault isVertical />
        </div>
      </div>

      <div>
        <p className="text-tertiary mb-2 text-xs">In Navigation</p>
        <div className="flex items-center gap-4">
          <span className="text-primary text-sm">Nav 1</span>
          <DividerDefault isVertical />
          <span className="text-primary text-sm">Nav 2</span>
          <DividerDefault isVertical />
          <span className="text-primary text-sm">Nav 3</span>
        </div>
      </div>
    </div>
  ),
};
