import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Users,
  FileText,
  Database,
  Settings,
} from "lucide-react";

import { SectionTitle } from "@/shared/components/design-system/section/SectionTitle";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta = {
  title: "Design System/Sections/SectionTitle",
  component: SectionTitle,
  parameters: {
    layout: "padded",
    design: getFigmaDesignConfigByNodeId("10101-29339"),
  },
  tags: ["autodocs"],
  argTypes: {
    icon: {
      control: false,
      description: "Icon element (ReactNode)",
    },
    title: {
      control: "text",
      description: "Section title text",
    },
    riskLevel: {
      control: false,
      description: "Risk level badge or indicator (ReactNode)",
    },
    description: {
      control: "text",
      description: "Section description text",
    },
  },
} satisfies Meta<typeof SectionTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <Shield className="text-primary size-6" />,
    title: "Security Overview",
    riskLevel: (
      <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
        <CheckCircle2 className="size-3" />
        Low Risk
      </span>
    ),
    description:
      "This section provides an overview of the security measures and risk assessments for the protocol.",
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

export const LowRisk: Story = {
  args: {
    icon: <CheckCircle2 className="text-success size-6" />,
    title: "Governance Participation",
    riskLevel: (
      <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
        <CheckCircle2 className="size-3" />
        Low Risk
      </span>
    ),
    description:
      "Active participation in governance decisions with regular voting activity and proposal submissions.",
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

export const MediumRisk: Story = {
  args: {
    icon: <AlertTriangle className="text-warning size-6" />,
    title: "Token Distribution",
    riskLevel: (
      <span className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500">
        <AlertTriangle className="size-3" />
        Medium Risk
      </span>
    ),
    description:
      "Token concentration among a small number of holders may pose centralization risks. Consider implementing wider distribution strategies.",
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

export const HighRisk: Story = {
  args: {
    icon: <Shield className="text-error size-6" />,
    title: "Smart Contract Audit",
    riskLevel: (
      <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
        <AlertTriangle className="size-3" />
        High Risk
      </span>
    ),
    description:
      "Critical vulnerabilities detected in the smart contract code. Immediate attention required to address security concerns before deployment.",
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

export const WithLongDescription: Story = {
  args: {
    icon: <Database className="text-primary size-6" />,
    title: "Data Management",
    riskLevel: (
      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
        In Review
      </span>
    ),
    description:
      "Comprehensive data management system ensuring secure storage, retrieval, and processing of sensitive information. The system implements industry-standard encryption protocols, regular backups, and access control mechanisms to protect against unauthorized access and data loss. All operations are logged and auditable for compliance purposes.",
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

export const WithShortTitle: Story = {
  args: {
    icon: <Lock className="text-primary size-6" />,
    title: "Access",
    riskLevel: (
      <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
        Secure
      </span>
    ),
    description: "Role-based access control is properly configured.",
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

export const WithoutBadge: Story = {
  args: {
    icon: <Users className="text-primary size-6" />,
    title: "Community Members",
    riskLevel: <span className="text-tertiary text-xs">1,234 members</span>,
    description:
      "Active community members participating in discussions and governance decisions.",
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

export const MobileView: Story = {
  args: {
    icon: <Shield className="text-primary size-6" />,
    title: "Protocol Security",
    riskLevel: (
      <span className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500">
        <AlertTriangle className="size-3" />
        Medium Risk
      </span>
    ),
    description:
      "Security audit has been completed with some recommendations for improvement.",
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

export const DesktopView: Story = {
  args: {
    icon: <Shield className="text-primary size-6" />,
    title: "Protocol Security",
    riskLevel: (
      <span className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500">
        <AlertTriangle className="size-3" />
        Medium Risk
      </span>
    ),
    description:
      "Security audit has been completed with some recommendations for improvement.",
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

export const InCard = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="bg-surface-hover max-w-4xl space-y-6 rounded-lg p-6">
      <SectionTitle
        icon={<FileText className="text-primary size-6" />}
        title="Document Analysis"
        riskLevel={
          <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
            <CheckCircle2 className="size-3" />
            Complete
          </span>
        }
        description="All documents have been reviewed and analyzed for compliance with regulatory requirements."
      />
      <div className="bg-surface-contrast h-px w-full" />
      <div className="text-secondary text-sm">
        <p>Additional content goes here...</p>
      </div>
    </div>
  ),
};

export const MultipleVariants = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="max-w-4xl space-y-8">
      <SectionTitle
        icon={<CheckCircle2 className="text-success size-6" />}
        title="Passed Security Audit"
        riskLevel={
          <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
            <CheckCircle2 className="size-3" />
            Low Risk
          </span>
        }
        description="All security checks have passed successfully with no critical issues found."
      />

      <SectionTitle
        icon={<AlertTriangle className="text-warning size-6" />}
        title="Token Concentration"
        riskLevel={
          <span className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500">
            <AlertTriangle className="size-3" />
            Medium Risk
          </span>
        }
        description="Top 10 holders control 45% of total supply. Consider implementing distribution strategies."
      />

      <SectionTitle
        icon={<Shield className="text-error size-6" />}
        title="Critical Vulnerabilities"
        riskLevel={
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
            <AlertTriangle className="size-3" />
            High Risk
          </span>
        }
        description="Multiple critical security vulnerabilities identified. Immediate action required."
      />
    </div>
  ),
};

export const DifferentIcons = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="max-w-4xl space-y-8">
      <SectionTitle
        icon={<Settings className="text-primary size-6" />}
        title="Configuration"
        riskLevel={
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
            Active
          </span>
        }
        description="System configuration and settings management."
      />

      <SectionTitle
        icon={<Database className="text-primary size-6" />}
        title="Data Storage"
        riskLevel={
          <span className="rounded-full bg-gray-500/10 px-3 py-1 text-xs font-medium text-gray-500">
            Stable
          </span>
        }
        description="Secure data storage and retrieval mechanisms."
      />

      <SectionTitle
        icon={<Users className="text-primary size-6" />}
        title="User Management"
        riskLevel={
          <span className="rounded-full border border-gray-500 px-3 py-1 text-xs font-medium text-gray-500">
            Configured
          </span>
        }
        description="User authentication and authorization systems."
      />
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
          <SectionTitle
            icon={<Shield className="text-primary size-6" />}
            title="Security Assessment"
            riskLevel={
              <span className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500">
                <AlertTriangle className="size-3" />
                Medium Risk
              </span>
            }
            description="Risk level appears below description on mobile devices for better readability."
          />
        </div>
      </div>

      <div>
        <h3 className="text-primary mb-4 text-lg font-semibold">
          Desktop Layout (≥ 640px)
        </h3>
        <div className="border-border-contrast max-w-3xl border p-4">
          <SectionTitle
            icon={<Shield className="text-primary size-6" />}
            title="Security Assessment"
            riskLevel={
              <span className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500">
                <AlertTriangle className="size-3" />
                Medium Risk
              </span>
            }
            description="Risk level appears inline with title on desktop for compact layout."
          />
        </div>
      </div>
    </div>
  ),
};
