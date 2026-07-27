import type { Meta, StoryObj } from "@storybook/nextjs";

import { OffchainResultsCard } from "@/features/governance/components/proposal-overview/OffchainResultsCard";

const FIGMA_FILE =
  "https://www.figma.com/design/mUgy2KpQ3gJ07yZaUaXu8l/Product-Design";

const CHOICES = [
  "USDC reserve name....",
  "ETH staking",
  "UNI buyback",
  "Grants program",
  "RWA vault pilot",
  "None of the above",
];

const SCORES = [512400, 308900, 196200, 118700, 58300, 22100];

/** Voting close, far in the future: proposal still open. */
const OPEN_END = Math.floor(Date.UTC(2099, 0, 1) / 1000);
/** Voting close, in the past: proposal closed. */
const CLOSED_END = Math.floor(Date.UTC(2020, 0, 1) / 1000);

const meta: Meta<typeof OffchainResultsCard> = {
  title: "Governance/Off-chain Results Card",
  component: OffchainResultsCard,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[384px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Frame 06 — the standalone results card, leading option in brand orange. */
export const Default: Story = {
  parameters: {
    design: { type: "figma", url: `${FIGMA_FILE}?node-id=3536-25873` },
  },
  args: { choices: CHOICES, scores: SCORES, end: OPEN_END },
};

/** Frame 10 — optimistic vote, chip while the indexer catches up. */
export const Indexing: Story = {
  parameters: {
    design: { type: "figma", url: `${FIGMA_FILE}?node-id=3536-25973` },
  },
  args: {
    choices: CHOICES,
    scores: SCORES,
    end: OPEN_END,
    indexingStatus: "indexing",
  },
};

/** Frame 10 — the vote landed; chip fades out after 1.2s. */
export const Indexed: Story = {
  args: {
    choices: CHOICES,
    scores: SCORES,
    end: OPEN_END,
    indexingStatus: "indexed",
  },
};

/** Frame 10 — past two minutes, Snapshot has it but the indexer lags. */
export const IndexerCatchingUp: Story = {
  args: {
    choices: CHOICES,
    scores: SCORES,
    end: OPEN_END,
    indexingStatus: "stuck",
  },
};

/** Frame 11 state A — voting open, votes encrypted. */
export const ShutterEncrypted: Story = {
  parameters: {
    design: { type: "figma", url: `${FIGMA_FILE}?node-id=3536-26060` },
  },
  args: {
    choices: CHOICES,
    scores: [0, 0, 0, 0, 0, 0],
    end: OPEN_END,
    isShutter: true,
  },
};

/** Frame 11 state B — voting ended, reveal pending. Never zeros. */
export const ShutterRevealPending: Story = {
  parameters: {
    design: { type: "figma", url: `${FIGMA_FILE}?node-id=3536-26060` },
  },
  args: {
    choices: CHOICES,
    scores: [0, 0, 0, 0, 0, 0],
    end: CLOSED_END,
    isShutter: true,
  },
};

/** Shutter, closed and revealed: renders as the normal results card. */
export const ShutterRevealed: Story = {
  args: {
    choices: CHOICES,
    scores: SCORES,
    end: CLOSED_END,
    isShutter: true,
  },
};
