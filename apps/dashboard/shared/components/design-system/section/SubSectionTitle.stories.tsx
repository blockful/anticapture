import type { Meta, StoryObj } from "@storybook/nextjs";
import { Calendar, TrendingUp, Filter, RefreshCw } from "lucide-react";

import { SubsectionTitle } from "@/shared/components/design-system/section/SubsectionTitle";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta = {
  title: "Design System/Sections/SubsectionTitle",
  component: SubsectionTitle,
  parameters: {
    layout: "padded",
    design: getFigmaDesignConfigByNodeId("10101-29339"),
  },
  tags: ["autodocs"],
  argTypes: {
    subsectionTitle: {
      control: "text",
      description: "Subsection title (string or ReactNode)",
    },
    subsectionDescription: {
      control: "text",
      description: "Description text",
    },
    dateRange: {
      control: "text",
      description: "Date range string",
    },
    switcherComponent: {
      control: false,
      description: "Optional switcher/toggle component",
    },
  },
} satisfies Meta<typeof SubsectionTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    subsectionTitle: "Activity Overview",
    subsectionDescription: "Recent activity and engagement metrics. ",
    dateRange: "Jan 1 - Dec 31, 2024",
    switcherComponent: null,
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

export const WithSwitcher: Story = {
  args: {
    subsectionTitle: "Revenue Metrics",
    subsectionDescription: "Track revenue across different time periods. ",
    dateRange: "Q1 2024",
    switcherComponent: (
      <div className="flex gap-2">
        <button className="bg-surface-action-primary text-inverted rounded px-3 py-1 text-xs">
          Daily
        </button>
        <button className="text-secondary hover:text-primary rounded px-3 py-1 text-xs">
          Weekly
        </button>
        <button className="text-secondary hover:text-primary rounded px-3 py-1 text-xs">
          Monthly
        </button>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

export const WithIconTitle: Story = {
  args: {
    subsectionTitle: (
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4" />
        <span>Performance Trends</span>
      </div>
    ),
    subsectionDescription: "System performance metrics over time. ",
    dateRange: "Last 30 days",
    switcherComponent: null,
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

export const WithFilterButton: Story = {
  args: {
    subsectionTitle: "User Activity",
    subsectionDescription: "Filter and view user activity logs. ",
    dateRange: "Today",
    switcherComponent: (
      <button className="text-secondary hover:text-primary border-border-contrast flex items-center gap-2 rounded border px-3 py-1.5 text-xs">
        <Filter className="size-3" />
        Filter
      </button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

export const WithRefreshButton: Story = {
  args: {
    subsectionTitle: "Live Data",
    subsectionDescription: "Real-time updates. ",
    dateRange: "Updated 2 mins ago",
    switcherComponent: (
      <button className="text-secondary hover:text-primary flex items-center gap-2 rounded px-3 py-1.5 text-xs">
        <RefreshCw className="size-3" />
        Refresh
      </button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

export const WithDropdown: Story = {
  args: {
    subsectionTitle: "Export Data",
    subsectionDescription: "Choose format and export your data. ",
    dateRange: "Last 7 days",
    switcherComponent: (
      <select className="text-secondary bg-surface-hover border-border-contrast cursor-pointer rounded border px-3 py-1.5 text-xs">
        <option>CSV</option>
        <option>JSON</option>
        <option>PDF</option>
      </select>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

export const LongDescription: Story = {
  args: {
    subsectionTitle: "Detailed Analytics",
    subsectionDescription:
      "Comprehensive analysis of user behavior patterns, engagement metrics, conversion rates, and overall platform performance. ",
    dateRange: "Jan 1 - Dec 31, 2024",
    switcherComponent: (
      <div className="flex gap-2">
        <button className="bg-surface-action-primary text-inverted rounded px-3 py-1 text-xs">
          View Report
        </button>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

export const ShortContent: Story = {
  args: {
    subsectionTitle: "Quick Stats",
    subsectionDescription: "Overview. ",
    dateRange: "Now",
    switcherComponent: null,
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

export const MobileView: Story = {
  args: {
    subsectionTitle: "Mobile Layout",
    subsectionDescription: "Test responsive behavior. ",
    dateRange: "Last 24 hours",
    switcherComponent: (
      <div className="flex gap-2">
        <button className="bg-surface-action-primary text-inverted rounded px-3 py-1 text-xs">
          Day
        </button>
        <button className="text-secondary hover:text-primary rounded px-3 py-1 text-xs">
          Week
        </button>
      </div>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

export const WithMultipleButtons: Story = {
  args: {
    subsectionTitle: "Content Management",
    subsectionDescription: "Manage and organize your content. ",
    dateRange: "Last modified: Yesterday",
    switcherComponent: (
      <div className="flex gap-2">
        <button className="text-secondary hover:text-primary border-border-contrast rounded border px-3 py-1.5 text-xs">
          Edit
        </button>
        <button className="bg-surface-action-primary text-inverted rounded px-3 py-1.5 text-xs">
          Publish
        </button>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

export const AllVariants = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="max-w-4xl space-y-8">
      <div>
        <p className="text-tertiary mb-4 text-xs">Without Switcher</p>
        <SubsectionTitle
          subsectionTitle="Basic Title"
          subsectionDescription="Simple subsection with no switcher component. "
          dateRange="Today"
          switcherComponent={null}
        />
      </div>

      <div>
        <p className="text-tertiary mb-4 text-xs">With Tab Switcher</p>
        <SubsectionTitle
          subsectionTitle="With Tabs"
          subsectionDescription="Subsection with tab navigation. "
          dateRange="Last 7 days"
          switcherComponent={
            <div className="flex gap-2">
              <button className="bg-surface-action-primary text-inverted rounded px-3 py-1 text-xs">
                Active
              </button>
              <button className="text-secondary hover:text-primary rounded px-3 py-1 text-xs">
                Inactive
              </button>
            </div>
          }
        />
      </div>

      <div>
        <p className="text-tertiary mb-4 text-xs">With Action Button</p>
        <SubsectionTitle
          subsectionTitle="With Button"
          subsectionDescription="Subsection with action button. "
          dateRange="Updated today"
          switcherComponent={
            <button className="text-secondary hover:text-primary border-border-contrast rounded border px-3 py-1.5 text-xs">
              <Calendar className="mr-1 inline size-3" />
              Schedule
            </button>
          }
        />
      </div>

      <div>
        <p className="text-tertiary mb-4 text-xs">With Icon Title</p>
        <SubsectionTitle
          subsectionTitle={
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4" />
              <span>Icon Title</span>
            </div>
          }
          subsectionDescription="Subsection with icon in title. "
          dateRange="Last month"
          switcherComponent={null}
        />
      </div>
    </div>
  ),
};

export const ResponsiveComparison = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="space-y-12">
      <div>
        <h3 className="text-primary mb-4 text-lg font-semibold">
          Mobile Layout (≤ 640px)
        </h3>
        <div className="border-border-contrast max-w-sm border p-4">
          <SubsectionTitle
            subsectionTitle="Responsive Title"
            subsectionDescription="Switcher stacks on mobile. "
            dateRange="Last week"
            switcherComponent={
              <div className="flex gap-2">
                <button className="bg-surface-action-primary text-inverted rounded px-3 py-1 text-xs">
                  Option 1
                </button>
                <button className="text-secondary hover:text-primary rounded px-3 py-1 text-xs">
                  Option 2
                </button>
              </div>
            }
          />
        </div>
      </div>

      <div>
        <h3 className="text-primary mb-4 text-lg font-semibold">
          Desktop Layout (≥ 640px)
        </h3>
        <div className="border-border-contrast max-w-3xl border p-4">
          <SubsectionTitle
            subsectionTitle="Responsive Title"
            subsectionDescription="Switcher appears inline on desktop. "
            dateRange="Last week"
            switcherComponent={
              <div className="flex gap-2">
                <button className="bg-surface-action-primary text-inverted rounded px-3 py-1 text-xs">
                  Option 1
                </button>
                <button className="text-secondary hover:text-primary rounded px-3 py-1 text-xs">
                  Option 2
                </button>
              </div>
            }
          />
        </div>
      </div>
    </div>
  ),
};
