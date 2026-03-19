import type { Meta, StoryObj } from "@storybook/nextjs";

import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import { ClickableCard } from "@/shared/components/design-system/cards/clickable-card/ClickableCard";
import { DaoAvatarIcon } from "@/shared/components/icons/DaoAvatarIcon";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const uniswap = DaoIdEnum.UNISWAP;
const uniswapLabel = daoConfigByDaoId[uniswap].name;

const DAOAvatar = () => (
  <DaoAvatarIcon daoId={uniswap} className="size-9" isRounded />
);

const SampleBadge = () => <BadgeStatus variant="secondary">Beta</BadgeStatus>;

const meta = {
  title: "Data Display/Cards/ClickableCard",
  component: ClickableCard,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("21632-1110"),
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Card title text",
    },
    subtitle: {
      control: "text",
      description: "Metadata text shown below title in compact layout",
    },
    description: {
      control: "text",
      description: "Long description — triggers the tall layout when provided",
    },
    avatar: {
      control: false,
      description: "Avatar node (DAO icon or generic avatar)",
    },
    badge: {
      control: false,
      description: "Badge node shown after the title",
    },
    disabled: {
      control: "boolean",
      description: "Disabled state — reduces opacity and blocks interaction",
    },
    onClick: {
      action: "clicked",
      description: "Click handler",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<typeof ClickableCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: uniswapLabel,
    subtitle: "October, 2024",
    avatar: <DAOAvatar />,
    disabled: false,
  },
  decorators: [
    (Story) => (
      <div className="w-[265px]">
        <Story />
      </div>
    ),
  ],
};

export const AllStates: Story = {
  args: { title: uniswapLabel },
  render: () => (
    <div className="flex w-[265px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-secondary px-1 text-xs">Default — compact</span>
        <ClickableCard
          title={uniswapLabel}
          subtitle="October, 2024"
          avatar={<DAOAvatar />}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-secondary px-1 text-xs">
          Default — compact with badge
        </span>
        <ClickableCard
          title={uniswapLabel}
          subtitle="October, 2024"
          avatar={<DAOAvatar />}
          badge={<SampleBadge />}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-secondary px-1 text-xs">
          Default — large description
        </span>
        <ClickableCard
          title="Governance Alerts"
          avatar={<DAOAvatar />}
          badge={<SampleBadge />}
          description="You're in crypto, so real-time governance alerts on Telegram are a must."
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-secondary px-1 text-xs">Disabled — compact</span>
        <ClickableCard
          title={uniswapLabel}
          subtitle="October, 2024"
          avatar={<DAOAvatar />}
          disabled
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-secondary px-1 text-xs">
          Disabled — large description
        </span>
        <ClickableCard
          title="Governance Alerts"
          avatar={<DAOAvatar />}
          badge={<SampleBadge />}
          description="You're in crypto, so real-time governance alerts on Telegram are a must."
          disabled
        />
      </div>
    </div>
  ),
};
