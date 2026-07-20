import type { Meta, StoryObj } from "@storybook/nextjs";

import { CodeBlock } from "@/shared/components/design-system/code-block/CodeBlock";

// TODO: link the Figma node via getFigmaDesignConfigByNodeId once the
// component page exists in Figma (pattern mirrors the gov frontend's
// calldata/Encode block).
const meta = {
  title: "Data Display/CodeBlock",
  component: CodeBlock,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    code: {
      control: "text",
      description: "Text rendered in the block",
    },
    copyText: {
      control: "text",
      description:
        "Text placed on the clipboard — defaults to `code`. Use when the rendered text is redacted (e.g. a truncated secret).",
    },
    className: {
      control: "text",
      description: "Container overrides (e.g. a min height)",
    },
    codeClassName: {
      control: "text",
      description: "Code element overrides (e.g. `break-all` for tokens)",
    },
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const decorators: Story["decorators"] = [
  (StoryFn) => (
    <div className="w-[640px] max-w-full">
      <StoryFn />
    </div>
  ),
];

export const Default: Story = {
  args: {
    code: 'claude mcp add anticapture --transport http https://mcp.anticapture.com/mcp --header "Authorization: Bearer <YOUR_API_KEY>"',
  },
  decorators,
};

export const MultiLine: Story = {
  args: {
    code: [
      "// add to ~/.cursor/mcp.json",
      "{",
      '  "mcpServers": {',
      '    "anticapture": {',
      '      "url": "https://mcp.anticapture.com/mcp",',
      '      "headers": { "Authorization": "Bearer <YOUR_API_KEY>" }',
      "    }",
      "  }",
      "}",
    ].join("\n"),
    className: "min-h-[84px]",
  },
  decorators,
};

export const RedactedCopy: Story = {
  args: {
    code: "act_EsX-wA-V…",
    copyText: "act_EsX-wA-VCec2Wdp0qZl3eR2ID1oVQJC_3Eo5ecqnUwU",
    codeClassName: "break-all",
  },
  decorators,
};
