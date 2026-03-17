import type { Meta, StoryObj } from "@storybook/nextjs";

import {
  Illustration,
  ILLUSTRATIONS,
} from "@/shared/components/design-system/illustration/Illustration";
import type { IllustrationName } from "@/shared/components/design-system/illustration/Illustration";

const meta = {
  title: "Design System/Primitives/Illustration",
  component: Illustration,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "select",
      options: [
        "satellite",
        "not-found",
        "cookie",
        "orbit",
      ] satisfies IllustrationName[],
      description: "Illustration asset to render",
    },
    width: {
      control: "number",
      description: "Override width in px",
    },
    height: {
      control: "number",
      description: "Override height in px",
    },
  },
} satisfies Meta<typeof Illustration>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "satellite",
  },
};

export const AllIllustrations: Story = {
  name: "Illustration System",
  args: {
    name: "satellite",
  },
  render: () => (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-primary text-h3 font-semibold">
          Illustration System
        </h1>
        <p className="text-secondary text-body-md mt-2">
          Illustrations are flat, geometric, and space/orbit-themed. They use
          the brand palette (brand orange, zinc grays) or monochrome. Never use
          them as decorative filler — each illustration maps to a specific
          context.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(
          Object.entries(ILLUSTRATIONS) as [
            IllustrationName,
            (typeof ILLUSTRATIONS)[IllustrationName],
          ][]
        ).map(([name, meta]) => (
          <div
            key={name}
            className="bg-surface-default border-border-contrast flex flex-col gap-4 rounded-lg border p-6"
          >
            <div className="bg-surface-contrast flex min-h-[160px] items-center justify-center rounded-md p-4">
              <Illustration name={name} />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-primary font-mono text-sm font-medium">
                {name}
              </p>
              <p className="text-secondary text-body-sm">{meta.context}</p>
              <code className="text-dimmed mt-1 font-mono text-[10px]">
                {meta.src}
              </code>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="text-primary text-h4 font-semibold">Style Rules</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              title: "Style",
              body: "Flat geometric shapes with minimal detail. Avoid photorealistic or painterly styles.",
            },
            {
              title: "Color",
              body: "Use brand orange (#ec762e) as accent. Backgrounds should be zinc grays or transparent. Never use gradients without explicit design approval.",
            },
            {
              title: "Usage context",
              body: "Each illustration has a defined context (see above). Don't reuse an illustration outside its intended context.",
            },
            {
              title: "Sizing",
              body: "Maintain natural aspect ratio. Minimum display size: 80px. Scale with the viewport — use responsive width classes.",
            },
          ].map(({ title, body }) => (
            <div key={title} className="bg-surface-contrast rounded-lg p-4">
              <p className="text-primary mb-1 text-sm font-semibold">{title}</p>
              <p className="text-secondary text-body-sm">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};
