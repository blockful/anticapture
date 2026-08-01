import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";

import { OffchainVotedModal } from "@/features/governance/components/modals/OffchainVotedModal";
import { OffchainVotedChip } from "@/features/governance/components/proposal-overview/OffchainVotedChip";

const FIGMA_FILE =
  "https://www.figma.com/design/mUgy2KpQ3gJ07yZaUaXu8l/Product-Design";

/** Jul 12 2026 and Jul 14 2026, matching the frames' sample dates. */
const VOTED_AT = Math.floor(Date.UTC(2026, 6, 12, 12) / 1000);
const CHIP_VOTED_AT = Math.floor(Date.UTC(2026, 6, 14, 12) / 1000);

const meta: Meta = {
  title: "Governance/Off-chain Voted State",
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj;

/** Frame 05 — read-only voted state, weighted vote with a dimmed 0% option. */
export const VotedModal: Story = {
  parameters: {
    design: { type: "figma", url: `${FIGMA_FILE}?node-id=3536-25714` },
  },
  render: () => {
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);
      return (
        <OffchainVotedModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onChangeVote={() => setIsOpen(false)}
          canChangeVote
          choices={[
            "USDC reserve",
            "ETH staking",
            "UNI buyback",
            "Grants program",
          ]}
          weights={[50, 30, 20, 0]}
          choiceLabels={["USDC reserve", "ETH staking", "UNI buyback"]}
          votedAt={VOTED_AT}
          votingPower={10_500}
          tokenSymbol="UNI"
          comment="Diversifying into stables reduces drawdown risk while keeping upside via staking."
        />
      );
    };
    return <Demo />;
  },
};

/** Ballots without a meaningful share list the chosen options instead of bars. */
export const VotedModalRanked: Story = {
  render: () => {
    const Demo = () => {
      const [isOpen, setIsOpen] = useState(true);
      return (
        <OffchainVotedModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onChangeVote={() => setIsOpen(false)}
          canChangeVote
          choices={["Security audits", "Grants round 4", "Protocol R&D"]}
          weights={null}
          choiceLabels={["Grants round 4", "Security audits", "Protocol R&D"]}
          votedAt={VOTED_AT}
          votingPower={10_500}
          tokenSymbol="UNI"
        />
      );
    };
    return <Demo />;
  },
};

/** Frame 13 — the "You voted For" chip, with its hover tooltip. */
export const VotedChip: Story = {
  parameters: {
    design: { type: "figma", url: `${FIGMA_FILE}?node-id=3536-26242` },
  },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <OffchainVotedChip
        voteLabel="For"
        proposalType="basic"
        votingPower={10_500}
        tokenSymbol="UNI"
        votedAt={CHIP_VOTED_AT}
        onClick={() => {}}
      />
      <OffchainVotedChip
        voteLabel="Security audits, Grants round 4, Protocol R&D"
        proposalType="ranked-choice"
        votingPower={10_500}
        tokenSymbol="UNI"
        votedAt={CHIP_VOTED_AT}
        onClick={() => {}}
      />
    </div>
  ),
};
