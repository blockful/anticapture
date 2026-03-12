import type { Meta, StoryObj } from "@storybook/nextjs";
import { ExternalLinkIcon, Key } from "lucide-react";

import { UnderlinedLink } from "@/shared/components/design-system/links/underlined-link/UnderlinedLink";

const meta: Meta<typeof UnderlinedLink> = {
  title: "Design System/Links/UnderlinedLink",
  component: UnderlinedLink,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=10339-16196",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    href: { control: "text" },
    openInNewTab: { control: "boolean" },
    children: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    href: "https://example.com",
    openInNewTab: true,
    children: "Example Link",
  },
};

export const InternalLink: Story = {
  args: {
    href: "/example",
    openInNewTab: false,
    children: "Internal Link",
  },
};

export const WithIcon: Story = {
  args: {
    href: "https://example.com",
    openInNewTab: true,
    children: (
      <>
        External Link
        <ExternalLinkIcon className="h-4 w-4" />
      </>
    ),
  },
};

export const WithIconAndResponsiveText: Story = {
  args: {
    href: "https://example.com/multisig",
    openInNewTab: true,
    children: (
      <>
        <Key className="text-tangerine size-3.5" />
        <span className="text-white">3/5</span>
        <span className="hidden lg:inline">required for transactions</span>
        <span className="inline lg:hidden"> required</span>
      </>
    ),
  },
};
