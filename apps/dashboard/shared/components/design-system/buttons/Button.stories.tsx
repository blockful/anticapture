import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/shared/components/design-system/buttons/Button";
import { CircleChevronRight } from "lucide-react";

const meta = {
  title: "Design System/Buttons/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "Button text",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description: "Button size: xs(16px), sm(24px), md(36px), lg(48px)",
    },
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "outline",
        "ghost",
        "destructive",
        "link",
      ],
      description: "Button variant",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with ENS address
export const Default: Story = {
  args: {
    variant: "primary",
    children: "Button",
  },
};

// With direct image URL
export const WithIcon: Story = {
  args: {
    variant: "primary",
    children: "Button",
    hasIcon: true,
    icon: CircleChevronRight,
  },
};

// Loading state
export const Loading: Story = {
  args: {
    variant: "primary",
    children: "Button",
    hasIcon: true,
    icon: CircleChevronRight,
    // isLoading: true,
  },
};

// Size variants
export const SizeVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <Button size="sm" />
        <span className="text-xs text-gray-400">SM</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button />
        <span className="text-xs text-gray-400">DEFAULT</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button size="lg" />
        <span className="text-xs text-gray-400">LG</span>
      </div>
    </div>
  ),
};

// Shape variants
export const ShapeVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <Button size="lg" variant="primary" />
        <span className="text-xs text-gray-400">Primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button size="lg" variant="secondary" />
        <span className="text-xs text-gray-400">Secondary</span>
      </div>
    </div>
  ),
};

// Loading states for different sizes
// export const LoadingStates: Story = {
//   render: () => (
//     <div className="flex items-center gap-4">
//       <div className="flex flex-col items-center gap-2">
//         <EnsAvatar size="xs" variant="rounded" loading={true} />
//         <span className="text-xs text-gray-400">XS Loading</span>
//       </div>
//       <div className="flex flex-col items-center gap-2">
//         <EnsAvatar size="sm" variant="rounded" loading={true} />
//         <span className="text-xs text-gray-400">SM Loading</span>
//       </div>
//       <div className="flex flex-col items-center gap-2">
//         <EnsAvatar size="md" variant="rounded" loading={true} />
//         <span className="text-xs text-gray-400">MD Loading</span>
//       </div>
//       <div className="flex flex-col items-center gap-2">
//         <EnsAvatar size="lg" variant="rounded" loading={true} />
//         <span className="text-xs text-gray-400">LG Loading</span>
//       </div>
//     </div>
//   ),
// };

// Fallback state (UserIcon fallback)
export const Fallback: Story = {
  args: {
    size: "lg",
    variant: "primary",
  },
};

// Fallback states for different sizes
// export const FallbackStates: Story = {
//   render: () => (
//     <div className="flex items-center gap-4">
//       <div className="flex flex-col items-center gap-2">
//         <EnsAvatar size="xs" variant="rounded" />
//         <span className="text-xs text-gray-400">XS Fallback</span>
//       </div>
//       <div className="flex flex-col items-center gap-2">
//         <EnsAvatar size="sm" variant="rounded" />
//         <span className="text-xs text-gray-400">SM Fallback</span>
//       </div>
//       <div className="flex flex-col items-center gap-2">
//         <EnsAvatar size="md" variant="rounded" />
//         <span className="text-xs text-gray-400">MD Fallback</span>
//       </div>
//       <div className="flex flex-col items-center gap-2">
//         <EnsAvatar size="lg" variant="rounded" />
//         <span className="text-xs text-gray-400">LG Fallback</span>
//       </div>
//     </div>
//   ),
// };

// Fallback with different shapes
// export const FallbackShapes: Story = {
//   render: () => (
//     <div className="flex items-center gap-4">
//       <div className="flex flex-col items-center gap-2">
//         <EnsAvatar size="lg" variant="rounded" />
//         <span className="text-xs text-gray-400">Rounded Fallback</span>
//       </div>
//       <div className="flex flex-col items-center gap-2">
//         <EnsAvatar size="lg" variant="square" />
//         <span className="text-xs text-gray-400">Square Fallback</span>
//       </div>
//     </div>
//   ),
// };

// With custom className
export const WithCustomStyling: Story = {
  args: {
    size: "lg",
    variant: "primary",
    className: "border-2 border-blue-500 shadow-lg",
  },
};
