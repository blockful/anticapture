import type { Meta, StoryObj } from "@storybook/nextjs";
import { SubSectionsContainer } from "@/shared/design-system/section/SubSectionsContainer";
import { SubSection } from "@/shared/design-system/section/SubSection";
import { Calendar, TrendingUp, Users } from "lucide-react";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta = {
  title: "Design System/Sections/SubSectionsContainer",
  component: SubSectionsContainer,
  parameters: {
    layout: "fullscreen",
    design: getFigmaDesignConfigByNodeId("10101-29339"),
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: false,
      description: "SubSection components or any ReactNode content",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<typeof SubSectionsContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="bg-surface-hover rounded-lg p-4">
        <p className="text-secondary text-sm">Content goes here...</p>
      </div>
    ),
  },
};

export const WithSingleSubSection: Story = {
  args: {
    children: (
      <SubSection
        subsectionTitle="Activity Overview"
        subsectionDescription="Recent activity and engagement metrics"
        dateRange="Jan 1 - Dec 31, 2024"
      >
        <div className="bg-surface-hover mt-4 rounded-lg p-4">
          <p className="text-secondary text-sm">Activity data goes here...</p>
        </div>
      </SubSection>
    ),
  },
};

export const WithMultipleSubSections: Story = {
  args: {
    children: (
      <>
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
      </>
    ),
  },
};

export const WithCustomClassName: Story = {
  args: {
    className: "bg-surface-hover border border-border-contrast rounded-lg",
    children: (
      <SubSection
        subsectionTitle="Styled Container"
        subsectionDescription="Container with custom styling"
        dateRange="Today"
      >
        <div className="bg-surface-contrast mt-4 rounded-lg p-4">
          <p className="text-secondary text-sm">Custom styled content</p>
        </div>
      </SubSection>
    ),
  },
};

export const MobileView: Story = {
  args: {
    children: (
      <>
        <SubSection
          subsectionTitle="Mobile Layout"
          subsectionDescription="Test responsive behavior on mobile"
          dateRange="Today"
        >
          <div className="bg-surface-hover mt-4 rounded-lg p-4">
            <p className="text-secondary text-sm">Mobile content</p>
          </div>
        </SubSection>

        <SubSection subsectionTitle="Statistics" dateRange="Last 7 days">
          <div className="mt-4 space-y-2">
            <div className="bg-surface-hover flex items-center justify-between rounded p-3">
              <span className="text-secondary text-sm">Total Views</span>
              <span className="text-primary text-sm font-medium">1,234</span>
            </div>
          </div>
        </SubSection>
      </>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const WithMixedContent = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <SubSectionsContainer>
      <SubSection
        subsectionTitle="Revenue Metrics"
        subsectionDescription="Track revenue across different time periods"
        dateRange="Q1 2024"
        switcherComponent={
          <div className="flex gap-2">
            <button className="bg-surface-action-primary text-inverted rounded px-3 py-1 text-xs">
              Daily
            </button>
            <button className="text-secondary hover:text-primary rounded px-3 py-1 text-xs">
              Weekly
            </button>
          </div>
        }
      >
        <div className="bg-surface-hover mt-4 rounded-lg p-6">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="text-success size-5" />
            <span className="text-primary text-2xl font-semibold">
              $124,500
            </span>
          </div>
          <p className="text-secondary text-sm">+12% from last quarter</p>
        </div>
      </SubSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SubSection subsectionTitle="Total Users" dateRange="Last 30 days">
          <div className="bg-surface-hover mt-4 rounded-lg p-4 text-center">
            <Users className="text-primary mx-auto mb-2 size-8" />
            <p className="text-primary text-2xl font-semibold">1,234</p>
            <p className="text-secondary mt-1 text-xs">+15% growth</p>
          </div>
        </SubSection>

        <SubSection subsectionTitle="Active Sessions" dateRange="Real-time">
          <div className="bg-surface-hover mt-4 rounded-lg p-4 text-center">
            <p className="text-primary text-2xl font-semibold">89</p>
            <p className="text-secondary mt-1 text-xs">Currently active</p>
          </div>
        </SubSection>
      </div>

      <SubSection
        subsectionTitle="Recent Transactions"
        subsectionDescription="Latest transaction history"
        dateRange="Last 7 days"
      >
        <div className="border-border-contrast mt-4 overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-surface-hover">
              <tr>
                <th className="text-secondary px-4 py-3 text-left text-xs font-medium">
                  Date
                </th>
                <th className="text-secondary px-4 py-3 text-left text-xs font-medium">
                  Type
                </th>
                <th className="text-secondary px-4 py-3 text-right text-xs font-medium">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-border-contrast divide-y">
              {[
                { date: "Dec 10", type: "Payment", amount: "$500" },
                { date: "Dec 9", type: "Refund", amount: "-$50" },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="text-secondary px-4 py-3 text-sm">
                    {row.date}
                  </td>
                  <td className="text-primary px-4 py-3 text-sm">{row.type}</td>
                  <td className="text-primary px-4 py-3 text-right text-sm">
                    {row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SubSection>
    </SubSectionsContainer>
  ),
};

export const WithDifferentBackgrounds = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <p className="text-tertiary mb-4 text-sm">
          Default Background (changes on sm breakpoint)
        </p>
        <SubSectionsContainer>
          <SubSection
            subsectionTitle="Default Style"
            subsectionDescription="Background changes at sm breakpoint"
            dateRange="Today"
          >
            <div className="bg-surface-hover mt-4 rounded-lg p-4">
              <p className="text-secondary text-sm">
                Content in default container
              </p>
            </div>
          </SubSection>
        </SubSectionsContainer>
      </div>

      <div>
        <p className="text-tertiary mb-4 text-sm">Custom Background</p>
        <SubSectionsContainer className="bg-surface-hover border-border-contrast rounded-lg border">
          <SubSection
            subsectionTitle="Custom Style"
            subsectionDescription="Container with custom background"
            dateRange="Today"
          >
            <div className="bg-surface-contrast mt-4 rounded-lg p-4">
              <p className="text-secondary text-sm">
                Content in custom container
              </p>
            </div>
          </SubSection>
        </SubSectionsContainer>
      </div>
    </div>
  ),
};

export const ResponsiveComparison = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="space-y-12 p-8">
      <div>
        <h3 className="text-primary mb-4 text-lg font-semibold">
          Mobile Layout (≤ 640px)
        </h3>
        <p className="text-secondary mb-4 text-sm">
          No background color, no padding
        </p>
        <div className="border-border-contrast max-w-sm border">
          <SubSectionsContainer>
            <SubSection subsectionTitle="Section 1" dateRange="Today">
              <div className="bg-surface-hover mt-4 rounded-lg p-4">
                <p className="text-secondary text-sm">Content</p>
              </div>
            </SubSection>
            <SubSection subsectionTitle="Section 2" dateRange="Today">
              <div className="bg-surface-hover mt-4 rounded-lg p-4">
                <p className="text-secondary text-sm">Content</p>
              </div>
            </SubSection>
          </SubSectionsContainer>
        </div>
      </div>

      <div>
        <h3 className="text-primary mb-4 text-lg font-semibold">
          Desktop Layout (≥ 640px)
        </h3>
        <p className="text-secondary mb-4 text-sm">
          With bg-surface-default and p-5
        </p>
        <div className="border-border-contrast border">
          <SubSectionsContainer>
            <SubSection subsectionTitle="Section 1" dateRange="Today">
              <div className="bg-surface-hover mt-4 rounded-lg p-4">
                <p className="text-secondary text-sm">Content</p>
              </div>
            </SubSection>
            <SubSection subsectionTitle="Section 2" dateRange="Today">
              <div className="bg-surface-hover mt-4 rounded-lg p-4">
                <p className="text-secondary text-sm">Content</p>
              </div>
            </SubSection>
          </SubSectionsContainer>
        </div>
      </div>
    </div>
  ),
};

export const EmptyContainer: Story = {
  args: {
    children: (
      <div className="p-12 text-center">
        <p className="text-secondary text-sm">No subsections added yet</p>
      </div>
    ),
  },
};
