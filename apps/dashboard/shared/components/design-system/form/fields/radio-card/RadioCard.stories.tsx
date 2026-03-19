import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";

import { RadioCard } from "@/shared/components/design-system/form/fields/radio-card/RadioCard";
import type { RadioCardProps } from "@/shared/components/design-system/form/fields/radio-card/RadioCard";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const OPTIONS = [
  { id: "uniswap", label: "Uniswap" },
  { id: "compound", label: "Compound" },
  { id: "aave", label: "Aave" },
];

const RadioCardGroupDemo = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex w-[265px] flex-col gap-2">
      {OPTIONS.map((opt) => (
        <RadioCard
          key={opt.id}
          label={opt.label}
          isSelected={selected === opt.id}
          onClick={() => setSelected(opt.id)}
        />
      ))}
    </div>
  );
};

const meta: Meta<RadioCardProps> = {
  title: "Data Entry/Form/RadioCard",
  component: RadioCard,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("16447-130123"),
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Option label text",
    },
    hasIcon: {
      control: "boolean",
      description: "Show a check-circle icon before the label",
    },
    isRadioRight: {
      control: "boolean",
      description: "Position the radio indicator on the right side",
    },
    isSelected: {
      control: "boolean",
      description: "Whether this option is currently selected",
    },
    disabled: {
      control: "boolean",
      description: "Disabled state — reduces opacity and blocks interaction",
    },
    onClick: {
      action: "clicked",
      description: "Click handler",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<RadioCardProps>;

export const Default: Story = {
  args: {
    label: "Uniswap",
    isSelected: false,
    disabled: false,
    hasIcon: false,
    isRadioRight: false,
  },
  decorators: [
    (StoryFn) => (
      <div className="w-[265px]">
        <StoryFn />
      </div>
    ),
  ],
};

export const Interactive: Story = {
  args: { label: "Uniswap" },
  render: () => <RadioCardGroupDemo />,
};

export const AllStates: Story = {
  args: { label: "Uniswap" },
  render: () => (
    <div className="flex gap-8">
      {/* Left radio */}
      <div className="flex w-[265px] flex-col gap-6">
        <p className="text-secondary text-xs font-medium uppercase tracking-wide">
          Radio left
        </p>

        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs">Default</span>
          <RadioCard label="Uniswap" isSelected={false} />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs">Selected</span>
          <RadioCard label="Uniswap" isSelected />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs">Default + Icon</span>
          <RadioCard label="Uniswap" isSelected={false} hasIcon />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs">Selected + Icon</span>
          <RadioCard label="Uniswap" isSelected hasIcon />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs">Disabled</span>
          <RadioCard label="Uniswap" isSelected={false} disabled />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs">Disabled + Selected</span>
          <RadioCard label="Uniswap" isSelected disabled />
        </div>
      </div>

      {/* Right radio */}
      <div className="flex w-[265px] flex-col gap-6">
        <p className="text-secondary text-xs font-medium uppercase tracking-wide">
          Radio right
        </p>

        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs">Default</span>
          <RadioCard label="Uniswap" isSelected={false} isRadioRight />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs">Selected</span>
          <RadioCard label="Uniswap" isSelected isRadioRight />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs">Default + Icon</span>
          <RadioCard label="Uniswap" isSelected={false} isRadioRight hasIcon />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs">Selected + Icon</span>
          <RadioCard label="Uniswap" isSelected isRadioRight hasIcon />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs">Disabled</span>
          <RadioCard label="Uniswap" isSelected={false} isRadioRight disabled />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-secondary text-xs">Disabled + Selected</span>
          <RadioCard label="Uniswap" isSelected isRadioRight disabled />
        </div>
      </div>
    </div>
  ),
};
