import type { Meta, StoryObj } from "@storybook/nextjs";

import { ProgressBar } from "@/shared/components/design-system/progress-bar/ProgressBar";
import type { ProgressBarProps } from "@/shared/components/design-system/progress-bar/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<ProgressBarProps> = {
  title: "Design System/Progress Bar/ProgressBar",
  component: ProgressBar,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("21932-7368"),
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description:
        "Fill percentage (0–100). Ignored when segments is provided.",
    },
    label: {
      control: "text",
      description: "Descriptive text rendered adjacent to the track",
    },
    labelPosition: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
      description: "Where the label is rendered relative to the track",
    },
    size: {
      control: "select",
      options: ["default", "large"],
      description: "Track height — default (4px) or large (8px)",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<ProgressBarProps>;

export const Default: Story = {
  args: {
    value: 60,
    label: "Label",
    labelPosition: "top",
    size: "default",
  },
  decorators: [
    (Story) => (
      <div className="w-[270px]">
        <Story />
      </div>
    ),
  ],
};

export const Sizes: Story = {
  render: () => (
    <div className="flex w-[270px] flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-secondary text-xs">Default — 4px</span>
        <ProgressBar value={60} label="Label" size="default" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-secondary text-xs">Large — 8px</span>
        <ProgressBar value={60} label="Label" size="large" />
      </div>
    </div>
  ),
};

export const LabelPositions: Story = {
  render: () => (
    <div className="flex w-[270px] flex-col gap-6">
      {(["top", "bottom", "left", "right"] as const).map((pos) => (
        <div key={pos} className="flex flex-col gap-1">
          <span className="text-secondary text-xs capitalize">{pos}</span>
          <ProgressBar value={60} label="Label" labelPosition={pos} />
        </div>
      ))}
    </div>
  ),
};

export const MultipleColors: Story = {
  render: () => (
    <div className="flex w-[270px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-secondary text-xs">Default size</span>
        <ProgressBar
          label="Label"
          labelPosition="top"
          size="default"
          segments={[
            { value: 33, color: "success" },
            { value: 33, color: "error" },
            { value: 34, color: "warning" },
          ]}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-secondary text-xs">Large size</span>
        <ProgressBar
          label="Label"
          labelPosition="top"
          size="large"
          segments={[
            { value: 33, color: "success" },
            { value: 33, color: "error" },
            { value: 34, color: "warning" },
          ]}
        />
      </div>
    </div>
  ),
};

export const WithMarker: Story = {
  render: () => (
    <div className="flex w-[270px] flex-col gap-10">
      <div className="flex flex-col gap-1">
        <span className="text-secondary text-xs">Label top + marker</span>
        <ProgressBar
          value={60}
          label="Label"
          labelPosition="top"
          marker={{ value: 50, label: "Quorum: 1M" }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-secondary text-xs">Label bottom + marker</span>
        <ProgressBar
          value={60}
          label="Label"
          labelPosition="bottom"
          marker={{ value: 50, label: "Quorum: 1M" }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-secondary text-xs">Label left + marker</span>
        <ProgressBar
          value={60}
          label="Label"
          labelPosition="left"
          marker={{ value: 50, label: "Quorum: 1M" }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-secondary text-xs">Large + marker</span>
        <ProgressBar
          value={60}
          label="Label"
          labelPosition="top"
          size="large"
          marker={{ value: 50, label: "Quorum: 1M" }}
        />
      </div>
    </div>
  ),
};

export const WithMarkerAndMultipleColors: Story = {
  render: () => (
    <div className="flex w-[270px] flex-col gap-10">
      <ProgressBar
        label="Label"
        labelPosition="top"
        size="default"
        marker={{ value: 50, label: "Quorum: 1M" }}
        segments={[
          { value: 33, color: "success" },
          { value: 33, color: "error" },
          { value: 34, color: "warning" },
        ]}
      />
      <ProgressBar
        label="Label"
        labelPosition="top"
        size="large"
        marker={{ value: 50, label: "Quorum: 1M" }}
        segments={[
          { value: 33, color: "success" },
          { value: 33, color: "error" },
          { value: 34, color: "warning" },
        ]}
      />
    </div>
  ),
};
