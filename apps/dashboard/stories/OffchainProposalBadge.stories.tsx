import type { Meta, StoryObj } from "@storybook/nextjs";

import { OffchainProposalBadge } from "@/features/governance/components/proposal-overview/OffchainProposalBadge";

const FIGMA_FILE =
  "https://www.figma.com/design/mUgy2KpQ3gJ07yZaUaXu8l/Product-Design";

const meta: Meta<typeof OffchainProposalBadge> = {
  title: "Governance/Off-chain Proposal Badge",
  component: OffchainProposalBadge,
  parameters: {
    layout: "centered",
    design: { type: "figma", url: `${FIGMA_FILE}?node-id=3536-26205` },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Frame 12 — the full badge row, in derivation order. */
export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-2">
        <OffchainProposalBadge status="pending" />
        <OffchainProposalBadge status="active" />
        <OffchainProposalBadge status="passed" />
        <OffchainProposalBadge status="rejected" />
        <OffchainProposalBadge status="closed" />
      </div>
      <OffchainProposalBadge
        status="closed"
        winner={{ label: "RWA vault pilot", percent: 38.1 }}
      />
    </div>
  ),
};

export const Pending: Story = { args: { status: "pending" } };
export const Active: Story = { args: { status: "active" } };
export const Passed: Story = { args: { status: "passed" } };
export const Rejected: Story = { args: { status: "rejected" } };
export const Closed: Story = { args: { status: "closed" } };

/** Non-basic vote types close with the winner surfaced beside the badge. */
export const ClosedWithWinner: Story = {
  args: {
    status: "closed",
    winner: { label: "RWA vault pilot", percent: 38.1 },
  },
};
