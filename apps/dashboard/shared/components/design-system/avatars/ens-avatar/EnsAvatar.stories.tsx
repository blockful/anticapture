import type { Meta, StoryObj } from "@storybook/react";

import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";

const meta = {
  title: "Design System/Avatars/EnsAvatar",
  component: EnsAvatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    address: {
      control: "text",
      description: "Ethereum address to fetch ENS avatar from",
    },
    imageUrl: {
      control: "text",
      description: "Direct image URL (takes precedence over ENS)",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description: "Avatar size: xs(16px), sm(24px), md(36px), lg(48px)",
    },
    variant: {
      control: "select",
      options: ["square", "rounded"],
      description: "Avatar shape variant",
    },
    loading: {
      control: "boolean",
      description: "External loading state",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
    alt: {
      control: "text",
      description: "Alt text for accessibility",
    },
  },
} satisfies Meta<typeof EnsAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with ENS address
export const Default: Story = {
  args: {
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // vitalik.eth
    size: "md",
    variant: "rounded",
    loading: false,
  },
};

// With direct image URL
export const WithImageUrl: Story = {
  args: {
    imageUrl: "https://euc.li/duds.eth",
    size: "md",
    variant: "rounded",
    alt: "ENS Avatar",
  },
};

// Loading state
export const Loading: Story = {
  args: {
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    size: "md",
    variant: "rounded",
    loading: true,
  },
};

// Size variants
export const SizeVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar
          imageUrl="https://euc.li/duds.eth"
          size="xs"
          variant="rounded"
        />
        <span className="text-xs text-gray-400">XS (16px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar
          imageUrl="https://euc.li/duds.eth"
          size="sm"
          variant="rounded"
        />
        <span className="text-xs text-gray-400">SM (24px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar
          imageUrl="https://euc.li/duds.eth"
          size="md"
          variant="rounded"
        />
        <span className="text-xs text-gray-400">MD (36px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar
          imageUrl="https://euc.li/duds.eth"
          size="lg"
          variant="rounded"
        />
        <span className="text-xs text-gray-400">LG (48px)</span>
      </div>
    </div>
  ),
};

// Shape variants
export const ShapeVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar
          imageUrl="https://euc.li/duds.eth"
          size="lg"
          variant="rounded"
        />
        <span className="text-xs text-gray-400">Rounded</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar
          imageUrl="https://euc.li/duds.eth"
          size="lg"
          variant="square"
        />
        <span className="text-xs text-gray-400">Square</span>
      </div>
    </div>
  ),
};

// Loading states for different sizes
export const LoadingStates: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar size="xs" variant="rounded" loading={true} />
        <span className="text-xs text-gray-400">XS Loading</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar size="sm" variant="rounded" loading={true} />
        <span className="text-xs text-gray-400">SM Loading</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar size="md" variant="rounded" loading={true} />
        <span className="text-xs text-gray-400">MD Loading</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar size="lg" variant="rounded" loading={true} />
        <span className="text-xs text-gray-400">LG Loading</span>
      </div>
    </div>
  ),
};

// Fallback state (UserIcon fallback)
export const Fallback: Story = {
  args: {
    address: "0x0000000000000000000000000000000000000000", // Invalid address
    size: "lg",
    variant: "rounded",
  },
};

// Fallback states for different sizes
export const FallbackStates: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar size="xs" variant="rounded" />
        <span className="text-xs text-gray-400">XS Fallback</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar size="sm" variant="rounded" />
        <span className="text-xs text-gray-400">SM Fallback</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar size="md" variant="rounded" />
        <span className="text-xs text-gray-400">MD Fallback</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar size="lg" variant="rounded" />
        <span className="text-xs text-gray-400">LG Fallback</span>
      </div>
    </div>
  ),
};

// Fallback with different shapes
export const FallbackShapes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar size="lg" variant="rounded" />
        <span className="text-xs text-gray-400">Rounded Fallback</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <EnsAvatar size="lg" variant="square" />
        <span className="text-xs text-gray-400">Square Fallback</span>
      </div>
    </div>
  ),
};

// With custom className
export const WithCustomStyling: Story = {
  args: {
    imageUrl: "https://euc.li/duds.eth",
    size: "lg",
    variant: "rounded",
    className: "border-2 border-blue-500 shadow-lg",
  },
};

// Real ENS examples (these might load actual ENS data)
export const RealENSExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <EnsAvatar
          address="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik.eth
          size="md"
          variant="rounded"
        />
        <span className="text-sm text-gray-300">vitalik.eth</span>
      </div>
      <div className="flex items-center gap-4">
        <EnsAvatar
          address="0x983110309620D911731Ac0932219af06091b6744" // brantly.eth
          size="md"
          variant="rounded"
        />
        <span className="text-sm text-gray-300">brantly.eth</span>
      </div>
      <div className="flex items-center gap-4">
        <EnsAvatar
          address="0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5" // nick.eth
          size="md"
          variant="rounded"
        />
        <span className="text-sm text-gray-300">nick.eth</span>
      </div>
    </div>
  ),
};
