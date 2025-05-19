import type { Meta, StoryObj } from "@storybook/react";

import { UnderlinedLink } from "./UnderlinedLink";

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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </>
    ),
  },
};
