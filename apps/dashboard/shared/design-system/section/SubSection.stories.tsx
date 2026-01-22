import type { Meta, StoryObj } from "@storybook/nextjs";
import { SubSection } from "@/shared/design-system/section/SubSection";
import { Calendar, TrendingUp, Users, Activity } from "lucide-react";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta = {
  title: "Design System/Sections/SubSection",
  component: SubSection,
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
      description: "Optional description text",
    },
    dateRange: {
      control: "text",
      description: "Date range string",
    },
    switcherComponent: {
      control: false,
      description: "Optional switcher/toggle component",
    },
    children: {
      control: false,
      description: "Main content of the subsection",
    },
    className: {
      control: "text",
      description: "Additional CSS classes for the header container",
    },
  },
} satisfies Meta<typeof SubSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    subsectionTitle: "Activity Overview",
    subsectionDescription: "Recent activity and engagement metrics",
    dateRange: "Jan 1 - Dec 31, 2024",
    children: (
      <div className="bg-surface-hover mt-4 rounded-lg p-4">
        <p className="text-secondary text-sm">Content goes here...</p>
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

export const WithoutDescription: Story = {
  args: {
    subsectionTitle: "User Statistics",
    dateRange: "Last 30 days",
    children: (
      <div className="mt-4 space-y-2">
        <div className="bg-surface-hover flex items-center justify-between rounded p-3">
          <span className="text-secondary text-sm">Total Users</span>
          <span className="text-primary text-sm font-medium">1,234</span>
        </div>
        <div className="bg-surface-hover flex items-center justify-between rounded p-3">
          <span className="text-secondary text-sm">Active Users</span>
          <span className="text-primary text-sm font-medium">892</span>
        </div>
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

export const WithSwitcher: Story = {
  args: {
    subsectionTitle: "Revenue Metrics",
    subsectionDescription: "Track revenue across different time periods",
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
    children: (
      <div className="bg-surface-hover mt-4 rounded-lg p-6">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="text-success size-5" />
          <span className="text-primary text-2xl font-semibold">$124,500</span>
        </div>
        <p className="text-secondary text-sm">+12% from last quarter</p>
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
        <Users className="text-primary size-5" />
        <span>Team Members</span>
      </div>
    ),
    subsectionDescription: "Manage your team and their permissions",
    dateRange: "Updated today",
    children: (
      <div className="mt-4 space-y-3">
        {["Alice Johnson", "Bob Smith", "Carol Williams"].map((name, i) => (
          <div
            key={i}
            className="bg-surface-hover flex items-center justify-between rounded p-3"
          >
            <span className="text-primary text-sm">{name}</span>
            <span className="text-tertiary text-xs">Admin</span>
          </div>
        ))}
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

export const WithCustomClassName: Story = {
  args: {
    subsectionTitle: "Performance Metrics",
    subsectionDescription: "System performance over time",
    dateRange: "Last 7 days",
    className: "mb-6 pb-4 border-b border-border-contrast",
    children: (
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-surface-hover rounded-lg p-4 text-center">
          <p className="text-secondary mb-1 text-xs">CPU Usage</p>
          <p className="text-primary text-xl font-semibold">45%</p>
        </div>
        <div className="bg-surface-hover rounded-lg p-4 text-center">
          <p className="text-secondary mb-1 text-xs">Memory</p>
          <p className="text-primary text-xl font-semibold">2.4GB</p>
        </div>
        <div className="bg-surface-hover rounded-lg p-4 text-center">
          <p className="text-secondary mb-1 text-xs">Requests</p>
          <p className="text-primary text-xl font-semibold">1.2K</p>
        </div>
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

export const WithChart = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="max-w-4xl">
      <SubSection
        subsectionTitle="Engagement Trends"
        subsectionDescription="Track user engagement over time"
        dateRange="Jan - Dec 2024"
        switcherComponent={
          <div className="flex gap-2">
            <button className="bg-surface-action-primary text-inverted rounded px-3 py-1 text-xs">
              Chart
            </button>
            <button className="text-secondary hover:text-primary rounded px-3 py-1 text-xs">
              Table
            </button>
          </div>
        }
      >
        <div className="bg-surface-hover mt-4 flex h-64 items-center justify-center rounded-lg">
          <div className="text-center">
            <Activity className="text-secondary mx-auto mb-2 size-12" />
            <p className="text-secondary text-sm">
              Chart visualization would go here
            </p>
          </div>
        </div>
      </SubSection>
    </div>
  ),
};

export const WithTable = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="max-w-4xl">
      <SubSection
        subsectionTitle="Transaction History"
        subsectionDescription="Recent transactions and their status"
        dateRange="Last 30 days"
      >
        <div className="border-border-contrast mt-4 overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-surface-hover">
              <tr>
                <th className="text-secondary px-4 py-3 text-left text-xs font-medium">
                  Date
                </th>
                <th className="text-secondary px-4 py-3 text-left text-xs font-medium">
                  Description
                </th>
                <th className="text-secondary px-4 py-3 text-right text-xs font-medium">
                  Amount
                </th>
                <th className="text-secondary px-4 py-3 text-right text-xs font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-border-contrast divide-y">
              {[
                {
                  date: "Dec 10",
                  desc: "Payment received",
                  amount: "$500",
                  status: "Complete",
                },
                {
                  date: "Dec 9",
                  desc: "Subscription",
                  amount: "$29",
                  status: "Complete",
                },
                {
                  date: "Dec 8",
                  desc: "Refund",
                  amount: "-$15",
                  status: "Pending",
                },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="text-secondary px-4 py-3 text-sm">
                    {row.date}
                  </td>
                  <td className="text-primary px-4 py-3 text-sm">{row.desc}</td>
                  <td className="text-primary px-4 py-3 text-right text-sm">
                    {row.amount}
                  </td>
                  <td className="text-secondary px-4 py-3 text-right text-sm">
                    {row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SubSection>
    </div>
  ),
};

export const MultipleSubsections = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="max-w-4xl space-y-8">
      <SubSection
        subsectionTitle="Overview"
        subsectionDescription="General system overview and health status"
        dateRange="Last updated: 5 mins ago"
      >
        <div className="bg-surface-hover mt-4 rounded-lg p-4">
          <p className="text-success text-sm font-medium">
            ✓ All systems operational
          </p>
        </div>
      </SubSection>

      <SubSection
        subsectionTitle="Active Users"
        subsectionDescription="Currently active users and their sessions"
        dateRange="Real-time"
        switcherComponent={
          <button className="text-secondary hover:text-primary border-border-contrast rounded border px-3 py-1 text-xs">
            Refresh
          </button>
        }
      >
        <div className="bg-surface-hover mt-4 rounded-lg p-4">
          <p className="text-primary text-2xl font-semibold">142</p>
          <p className="text-secondary mt-1 text-sm">active sessions</p>
        </div>
      </SubSection>

      <SubSection subsectionTitle="Recent Activity" dateRange="Last 24 hours">
        <div className="mt-4 space-y-2">
          {["User login", "New registration", "Settings updated"].map(
            (activity, i) => (
              <div
                key={i}
                className="bg-surface-hover flex items-center gap-3 rounded p-3"
              >
                <Calendar className="text-secondary size-4" />
                <span className="text-primary text-sm">{activity}</span>
              </div>
            ),
          )}
        </div>
      </SubSection>
    </div>
  ),
};

export const EmptyState = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="max-w-4xl">
      <SubSection
        subsectionTitle="No Data Available"
        subsectionDescription="There is no data to display for this time period"
        dateRange="Jan 1 - Dec 31, 2024"
      >
        <div className="bg-surface-contrast mt-4 rounded-lg p-12 text-center">
          <Activity className="text-secondary mx-auto mb-3 size-12 opacity-50" />
          <p className="text-secondary text-sm">No activity found</p>
        </div>
      </SubSection>
    </div>
  ),
};
