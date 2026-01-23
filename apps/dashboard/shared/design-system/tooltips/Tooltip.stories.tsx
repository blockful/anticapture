import type { Meta, StoryObj } from "@storybook/nextjs";
import { Info, HelpCircle, AlertCircle } from "lucide-react";

import { Tooltip } from "@/shared/design-system/tooltips/Tooltip";
import { RiskLevel } from "@/shared/types/enums";
import { RiskLevelCardSmall } from "@/shared/components/cards/RiskLevelCardSmall";

const meta: Meta<typeof Tooltip> = {
  title: "Design System/Tooltips/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: false,
      description: "The trigger element that opens the tooltip",
    },
    tooltipContent: {
      control: "text",
      description: "The content displayed inside the tooltip",
    },
    title: {
      control: "text",
      description: "Optional title displayed at the top of the tooltip",
    },
    className: {
      control: "text",
      description: "Additional CSS classes for the tooltip content",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tooltipContent: "This is a simple tooltip message.",
  },
  render: (args) => (
    <Tooltip {...args}>
      <Info className="text-secondary size-4" />
    </Tooltip>
  ),
};

export const WithTitle: Story = {
  args: {
    title: "Information",
    tooltipContent: "This tooltip includes a title header with a divider.",
  },
  render: (args) => (
    <Tooltip {...args}>
      <Info className="text-secondary size-4" />
    </Tooltip>
  ),
};

export const LongContent: Story = {
  args: {
    tooltipContent:
      "This is a longer tooltip message that demonstrates how the component handles extended text content. It wraps properly and maintains readability across different screen sizes.",
  },
  render: (args) => (
    <Tooltip {...args}>
      <span className="text-primary text-lg font-normal leading-tight">
        Hover Me!
      </span>
    </Tooltip>
  ),
};

export const WithTitleAndLongContent: Story = {
  args: {
    title: (
      <div className="flex items-center justify-start gap-2">
        Detailed Information <RiskLevelCardSmall status={RiskLevel.HIGH} />
      </div>
    ),
    tooltipContent:
      "This tooltip demonstrates a combination of a title and longer content. The title appears at the top with proper styling, followed by a divider, and then the main content below.",
  },
  render: (args) => (
    <Tooltip {...args}>
      <Info className="text-secondary size-4" />
    </Tooltip>
  ),
};

export const DifferentIcons: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Tooltip tooltipContent="Info tooltip">
        <Info className="text-secondary size-4" />
      </Tooltip>
      <Tooltip tooltipContent="Help tooltip">
        <HelpCircle className="text-secondary size-4" />
      </Tooltip>
      <Tooltip
        title="Warning"
        tooltipContent="This is a warning tooltip with a title."
      >
        <AlertCircle className="text-secondary size-4" />
      </Tooltip>
    </div>
  ),
};

export const CustomStyling: Story = {
  args: {
    title: "Custom Styled",
    tooltipContent: "This tooltip has custom styling applied.",
    className: "bg-blue-500 border-blue-600",
  },
  render: (args) => (
    <Tooltip {...args}>
      <Info className="text-secondary size-4" />
    </Tooltip>
  ),
};

export const RichContent: Story = {
  args: {
    title: "Rich Content",
    tooltipContent: (
      <div className="space-y-2">
        <p className="text-sm">This tooltip contains rich content:</p>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>First item</li>
          <li>Second item</li>
          <li>Third item</li>
        </ul>
      </div>
    ),
  },
  render: (args) => (
    <Tooltip {...args}>
      <Info className="text-secondary size-4" />
    </Tooltip>
  ),
};
