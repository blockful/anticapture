import type { Meta, StoryObj } from "@storybook/react";

import { UnderlinedLink } from "@/shared/components/design-system/links/underlined-link/UnderlinedLink";
import { ExternalLinkIcon } from "lucide-react";

const meta = {
  title: "Design System/Links/UnderlinedLink",
  component: UnderlinedLink,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    href: { control: "text" },
    openInNewTab: { control: "boolean" },
    children: { control: "text" },
  },
} satisfies Meta<typeof UnderlinedLink>;

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
