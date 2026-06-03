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

export const ViewerFollowsTarget: Story = {
  args: {
    ...WithEfpCounts.args,
    viewerFollowsTarget: true,
    children: (
      <span className="text-primary text-sm underline decoration-[#FFE067] decoration-2 underline-offset-2">
        vitalik.eth
      </span>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "ENS name uses an EFP-yellow underline when the connected wallet follows this address (set by EnsAvatar from follower-state API).",
      },
    },
  },
};
