import type { Meta, StoryObj } from "@storybook/nextjs";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta = {
  title: "Design System/Layout/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen",
    design: getFigmaDesignConfigByNodeId("10339-57793"),
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default"],
      description: "The visual variant of the footer",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
  },
};

export const WithCustomClass: Story = {
  args: {
    variant: "default",
    className: "bg-surface-hover",
  },
};

export const InLightBackground = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="min-h-screen bg-white">
      <Footer />
    </div>
  ),
};

export const InDarkBackground = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="min-h-screen bg-black">
      <Footer />
    </div>
  ),
};

export const AtBottomOfPage = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="bg-surface flex min-h-screen flex-col">
      <div className="flex-1 p-8">
        <h1 className="text-primary mb-4 text-2xl font-bold">Page Content</h1>
        <p className="text-secondary mb-4">
          This demonstrates the footer at the bottom of a page with content.
        </p>
        <p className="text-secondary mb-4">
          Scroll down to see the footer in its natural position.
        </p>
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <p key={i} className="text-tertiary">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  ),
};

export const MobileView = {
  parameters: {
    controls: { disable: true },
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: () => (
    <div className="bg-surface p-4">
      <Footer />
    </div>
  ),
};

export const TabletView = {
  parameters: {
    controls: { disable: true },
    viewport: {
      defaultViewport: "tablet",
    },
  },
  render: () => (
    <div className="bg-surface p-4">
      <Footer />
    </div>
  ),
};

export const DesktopView = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="bg-surface p-4">
      <Footer />
    </div>
  ),
};

export const WithDifferentOpacity = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="bg-surface space-y-8 p-8">
      <div>
        <p className="text-tertiary mb-4 text-xs">
          Default (opacity-60, hover:opacity-100)
        </p>
        <Footer />
      </div>

      <div>
        <p className="text-tertiary mb-4 text-xs">
          Custom: Always Full Opacity
        </p>
        <Footer className="opacity-100" />
      </div>

      <div>
        <p className="text-tertiary mb-4 text-xs">Custom: Low Opacity</p>
        <Footer className="opacity-40 hover:opacity-80" />
      </div>
    </div>
  ),
};

export const InteractiveLinkTest = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="bg-surface p-8">
      <div className="mb-4 text-center">
        <p className="text-secondary text-sm">
          Hover over the links and social icons to see the transition effects
        </p>
      </div>
      <Footer />
    </div>
  ),
};

export const AllViewports = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="bg-surface space-y-12 p-8">
      <div>
        <h3 className="text-primary mb-4 text-lg font-semibold">
          Mobile Layout (≤ 640px)
        </h3>
        <div className="border-border-contrast max-w-sm border p-4">
          <Footer />
        </div>
      </div>

      <div>
        <h3 className="text-primary mb-4 text-lg font-semibold">
          Desktop Layout (≥ 640px)
        </h3>
        <div className="border-border-contrast border p-4">
          <Footer />
        </div>
      </div>
    </div>
  ),
};
