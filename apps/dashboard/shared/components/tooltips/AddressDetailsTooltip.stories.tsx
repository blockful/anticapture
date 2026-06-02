import type { Meta, StoryObj } from "@storybook/nextjs";

import { AddressDetailsTooltip } from "@/shared/components/tooltips/AddressDetailsTooltip";

const SAMPLE_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as const;

const meta: Meta<typeof AddressDetailsTooltip> = {
  title: "Data Display/AddressDetailsTooltip",
  component: AddressDetailsTooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    address: SAMPLE_ADDRESS,
    arkhamData: null,
    ens: null,
    efp: null,
    isContract: false,
    isLoading: true,
    children: (
      <span className="text-primary text-sm underline decoration-dashed">
        Hover me
      </span>
    ),
  },
};

export const NotInformed: Story = {
  args: {
    address: SAMPLE_ADDRESS,
    arkhamData: null,
    ens: null,
    efp: null,
    isContract: false,
    isLoading: false,
    children: (
      <span className="text-primary text-sm underline decoration-dashed">
        Hover me
      </span>
    ),
  },
};

export const WithEfpCounts: Story = {
  args: {
    address: SAMPLE_ADDRESS,
    arkhamData: {
      entity: "Vitalik Buterin",
      entityType: "individual",
      label: "Personal Wallet",
      twitter: "VitalikButerin",
    },
    ens: {
      name: "vitalik.eth",
      avatar: null,
      banner: null,
    },
    efp: {
      followersCount: 5396,
      followingCount: 10,
    },
    isContract: false,
    isLoading: false,
    children: (
      <span className="text-primary text-sm underline decoration-dashed">
        Hover me
      </span>
    ),
  },
};

export const WithViewerYouFollow: Story = {
  args: {
    ...WithEfpCounts.args,
    viewerAddress: "0x983110309620D911731Ac0932219af06091b6744",
  },
  parameters: {
    docs: {
      description: {
        story:
          'When a viewer address is provided, the tooltip may show "You follow" if the follower-state API confirms the relationship.',
      },
    },
  },
};
