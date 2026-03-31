import type { Meta, StoryObj } from "@storybook/nextjs";

import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

import { Skeleton } from "./Skeleton";
import type { SkeletonProps } from "./Skeleton";

const meta = {
  title: "Feedback/Loading Animation/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("168-2123"),
  },
  tags: ["autodocs"],
  argTypes: {
    shape: {
      control: "select",
      options: ["rectangle", "circle", "text"],
      description: "Controls the border-radius shape of the skeleton",
    },
    className: {
      control: "text",
      description:
        "Additional CSS classes — use w-* and h-* to control dimensions",
    },
  },
} satisfies Meta<SkeletonProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    shape: "rectangle",
    className: "w-64 h-10",
  },
};

export const AllStates: Story = {
  args: {
    shape: "rectangle",
  },
  render: () => (
    <div className="flex flex-col gap-8">
      {/* Shapes */}
      <div className="flex flex-col gap-3">
        <p className="text-secondary text-xs font-medium uppercase tracking-wider">
          Shapes
        </p>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Skeleton shape="rectangle" className="h-10 w-32" />
            <span className="text-secondary text-xs">Rectangle</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton shape="circle" className="size-10" />
            <span className="text-secondary text-xs">Circle</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton shape="text" className="h-4 w-24" />
            <span className="text-secondary text-xs">Text</span>
          </div>
        </div>
      </div>

      {/* Sizes — rectangle */}
      <div className="flex flex-col gap-3">
        <p className="text-secondary text-xs font-medium uppercase tracking-wider">
          Sizes — Rectangle
        </p>
        <div className="flex flex-col gap-2">
          <Skeleton shape="rectangle" className="h-4 w-full" />
          <Skeleton shape="rectangle" className="h-6 w-3/4" />
          <Skeleton shape="rectangle" className="h-8 w-1/2" />
          <Skeleton shape="rectangle" className="h-12 w-1/3" />
        </div>
      </div>

      {/* Sizes — circle */}
      <div className="flex flex-col gap-3">
        <p className="text-secondary text-xs font-medium uppercase tracking-wider">
          Sizes — Circle
        </p>
        <div className="flex items-center gap-4">
          <Skeleton shape="circle" className="size-6" />
          <Skeleton shape="circle" className="size-8" />
          <Skeleton shape="circle" className="size-10" />
          <Skeleton shape="circle" className="size-12" />
          <Skeleton shape="circle" className="size-16" />
        </div>
      </div>

      {/* Composite usage — card skeleton */}
      <div className="flex flex-col gap-3">
        <p className="text-secondary text-xs font-medium uppercase tracking-wider">
          Composite — Card Skeleton
        </p>
        <div className="bg-surface-default border-border-default flex flex-col gap-4 rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Skeleton shape="circle" className="size-10" />
            <div className="flex flex-col gap-2">
              <Skeleton shape="text" className="h-4 w-32" />
              <Skeleton shape="text" className="h-3 w-20" />
            </div>
          </div>
          <Skeleton shape="rectangle" className="h-24 w-full" />
          <div className="flex flex-col gap-2">
            <Skeleton shape="text" className="h-3 w-full" />
            <Skeleton shape="text" className="h-3 w-5/6" />
            <Skeleton shape="text" className="h-3 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  ),
};
