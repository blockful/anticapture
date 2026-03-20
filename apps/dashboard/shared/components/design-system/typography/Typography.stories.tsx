import type { Meta, StoryObj } from "@storybook/nextjs";

import { TypographyShowcase } from "@/shared/components/design-system/typography/Typography";

const meta = {
  title: "Foundation/Typography",
  component: TypographyShowcase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TypographyShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypeScale: Story = {
  name: "Type Scale",
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-primary text-h3 font-semibold">Typography</h1>
        <p className="text-secondary text-body-md mt-2">
          Typeface: <strong>Inter</strong> (sans-serif) ·{" "}
          <strong>Roboto Mono</strong> (monospace). All sizes defined as
          semantic tokens in{" "}
          <code className="bg-surface-contrast rounded px-1 text-xs">
            globals.css
          </code>
          .
        </p>
      </div>
      <TypographyShowcase />
    </div>
  ),
};

export const Typefaces: Story = {
  name: "Typefaces",
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-secondary text-xs font-medium uppercase tracking-wider">
          Sans-serif — Inter
        </p>
        <div className="flex flex-col gap-2">
          {(["400", "500", "600"] as const).map((weight) => (
            <div key={weight} className="flex items-baseline gap-4">
              <span className="text-dimmed w-10 font-mono text-xs">
                {weight}
              </span>
              <span
                className="text-primary text-h4"
                style={{ fontWeight: weight }}
              >
                Anticapture — governance clarity
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-secondary text-xs font-medium uppercase tracking-wider">
          Monospace — Roboto Mono
        </p>
        <div className="flex flex-col gap-2">
          {(["400", "500"] as const).map((weight) => (
            <div key={weight} className="flex items-baseline gap-4">
              <span className="text-dimmed w-10 font-mono text-xs">
                {weight}
              </span>
              <span
                className="text-primary text-h5 font-mono"
                style={{ fontWeight: weight }}
              >
                0x1234…abcd — 98.7% · PROTOCOL
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const WeightMapping: Story = {
  name: "Weight Mapping",
  render: () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-primary text-h4 font-semibold">Weight Mapping</h2>
      <table className="text-body-sm w-full">
        <thead>
          <tr className="border-border-contrast border-b text-left">
            <th className="text-secondary pb-2 font-medium">Usage</th>
            <th className="text-secondary pb-2 font-medium">Weight</th>
            <th className="text-secondary pb-2 font-medium">Tailwind</th>
          </tr>
        </thead>
        <tbody>
          {[
            {
              usage: "Display, H1–H2",
              weight: "700",
              tailwind: "font-bold",
            },
            { usage: "H3–H6", weight: "600", tailwind: "font-semibold" },
            {
              usage: "Labels, overline",
              weight: "500",
              tailwind: "font-medium",
            },
            { usage: "Body text", weight: "400", tailwind: "font-normal" },
          ].map(({ usage, weight, tailwind }) => (
            <tr
              key={weight}
              className="border-border-default border-b last:border-b-0"
            >
              <td className="text-primary py-3">{usage}</td>
              <td className="text-secondary py-3 font-mono">{weight}</td>
              <td className="py-3">
                <code className="bg-surface-contrast text-secondary rounded px-1.5 py-0.5 font-mono text-xs">
                  {tailwind}
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};
