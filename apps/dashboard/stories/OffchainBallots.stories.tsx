import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";

import { ApprovalVoteOptions } from "@/features/governance/components/modals/vote-options/ApprovalVoteOptions";
import { BasicVoteOptions } from "@/features/governance/components/modals/vote-options/BasicVoteOptions";
import { QuadraticVoteOptions } from "@/features/governance/components/modals/vote-options/QuadraticVoteOptions";
import { RankedChoiceOptions } from "@/features/governance/components/modals/vote-options/RankedChoiceOptions";
import { SingleChoiceOptions } from "@/features/governance/components/modals/vote-options/SingleChoiceOptions";
import { WeightedVoteOptions } from "@/features/governance/components/modals/vote-options/WeightedVoteOptions";

const FIGMA_FILE =
  "https://www.figma.com/design/mUgy2KpQ3gJ07yZaUaXu8l/Product-Design";

/** Ballots live inside a 600px-wide DS Modal, so preview them at that width. */
const BallotFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-surface-default border-border-default w-[600px] border">
    <div className="p-4">{children}</div>
  </div>
);

const meta: Meta = {
  title: "Governance/Off-chain Ballots",
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj;

/** Frame 01 — single choice ballot. */
export const SingleChoice: Story = {
  parameters: {
    design: { type: "figma", url: `${FIGMA_FILE}?node-id=3536-25484` },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<number | null>(2);
      return (
        <BallotFrame>
          <SingleChoiceOptions
            choices={[
              "Deploy fee switch on 3 pilot pools",
              "Deploy fee switch on 10 pools",
              "Deploy on all v3 pools",
              "Run a 90-day pilot first",
              "None of the above — rework",
            ]}
            value={value}
            onChange={setValue}
          />
        </BallotFrame>
      );
    };
    return <Demo />;
  },
};

/** Frame 02 — approval ballot with the "N of M selected" counter. */
export const Approval: Story = {
  parameters: {
    design: { type: "figma", url: `${FIGMA_FILE}?node-id=3536-25511` },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<number[] | null>([2, 4]);
      return (
        <BallotFrame>
          <ApprovalVoteOptions
            choices={[
              "blockful.eth",
              "wintermute.eth",
              "stablelab.eth",
              "karpatkey.eth",
              "avantgarde.eth",
              "penn-blockchain.eth",
            ]}
            value={value}
            onChange={setValue}
          />
        </BallotFrame>
      );
    };
    return <Demo />;
  },
};

/** Frame 03 — weighted ballot: allocation bar, remaining chip, running total. */
export const Weighted: Story = {
  parameters: {
    design: { type: "figma", url: `${FIGMA_FILE}?node-id=3536-25545` },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<Record<string, number> | null>({
        "1": 40,
        "2": 25,
        "3": 15,
        "4": 0,
      });
      return (
        <BallotFrame>
          <WeightedVoteOptions
            choices={[
              "USDC reserve",
              "ETH staking",
              "UNI buyback",
              "Grants program",
            ]}
            value={value}
            onChange={setValue}
          />
        </BallotFrame>
      );
    };
    return <Demo />;
  },
};

/** Frame 04 — ranked choice: drag grip, rank badge, chevrons, reorder hint. */
export const RankedChoice: Story = {
  parameters: {
    design: { type: "figma", url: `${FIGMA_FILE}?node-id=3536-25606` },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<number[] | null>(null);
      return (
        <BallotFrame>
          <RankedChoiceOptions
            choices={[
              "Security audits",
              "Liquidity incentives",
              "Grants round 4",
              "Protocol R&D",
              "Marketing & growth",
            ]}
            value={value}
            onChange={setValue}
          />
        </BallotFrame>
      );
    };
    return <Demo />;
  },
};

/** Frame 07 — overflow: option count, filter input, fixed-height scroll. */
export const LongOptionList: Story = {
  parameters: {
    design: { type: "figma", url: `${FIGMA_FILE}?node-id=3536-25750` },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<number | null>(4);
      return (
        <BallotFrame>
          <SingleChoiceOptions
            choices={[
              "Uniswap Foundation",
              "Protocol Guild",
              "DeFi Education Fund",
              "L2BEAT",
              "Ethereum Attestation Service",
              "Karpatkey",
              "StableLab",
              "Wintermute",
              "Blockful",
              "Avantgarde",
              "Penn Blockchain",
              "Michigan Blockchain",
              "Franklin DAO",
              "Boardroom",
            ]}
            value={value}
            onChange={setValue}
          />
        </BallotFrame>
      );
    };
    return <Demo />;
  },
};

/** Quadratic reuses the weighted ballot, with the n² credit cost as a second line. */
export const Quadratic: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<Record<string, number> | null>({
        "1": 50,
        "2": 30,
        "3": 20,
      });
      return (
        <BallotFrame>
          <QuadraticVoteOptions
            choices={["Security audits", "Grants round 4", "Protocol R&D"]}
            value={value}
            onChange={setValue}
          />
        </BallotFrame>
      );
    };
    return <Demo />;
  },
};

/**
 * Frame 09 — live impact preview on the single-choice ballot: per-row bar, voting
 * power and share, with a green delta on the selected row. The frame's own
 * numbers show only 3 rows of a longer list, so they do not sum to 100%; these
 * are self-consistent so the projection math is checkable.
 */
export const LiveImpactPreview: Story = {
  parameters: {
    design: { type: "figma", url: `${FIGMA_FILE}?node-id=3536-25938` },
  },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<number | null>(2);
      return (
        <BallotFrame>
          <SingleChoiceOptions
            choices={[
              "Deploy on all v3 pools",
              "Run a 90-day pilot first",
              "Deploy fee switch on 3 pilot pools",
            ]}
            value={value}
            onChange={setValue}
            liveImpact={{
              scores: [90_700, 371_800, 90_700],
              votingPower: 26_400,
            }}
          />
        </BallotFrame>
      );
    };
    return <Demo />;
  },
};

/** Basic (For / Against / Abstain). */
export const Basic: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<number | null>(1);
      return (
        <BallotFrame>
          <BasicVoteOptions
            choices={["For", "Against", "Abstain"]}
            value={value}
            onChange={setValue}
          />
        </BallotFrame>
      );
    };
    return <Demo />;
  },
};
