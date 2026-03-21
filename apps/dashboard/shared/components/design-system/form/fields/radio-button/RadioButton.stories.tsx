import type { Meta, StoryObj } from "@storybook/nextjs";

import { RadioButton } from "@/shared/components/design-system/form/fields/radio-button/RadioButton";
import type { RadioButtonProps } from "@/shared/components/design-system/form/fields/radio-button/RadioButton";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<RadioButtonProps> = {
  title: "Data Entry/Form/RadioButton",
  component: RadioButton,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("13-1660"),
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Label text displayed next to the radio indicator",
    },
    checked: {
      control: "boolean",
      description: "Whether the radio button is selected",
    },
    disabled: {
      control: "boolean",
      description: "Whether the radio button is disabled",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<RadioButtonProps>;

export const Default: Story = {
  args: {
    label: "Option A",
    checked: false,
    disabled: false,
  },
};

export const AllStates = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <RadioButton
          label="Default"
          checked={false}
          onChange={() => undefined}
        />
        <span className="text-secondary text-xs">Default</span>
      </div>
      <div className="flex flex-col gap-1">
        <RadioButton label="Selected" checked onChange={() => undefined} />
        <span className="text-secondary text-xs">Checked</span>
      </div>
      <div className="flex flex-col gap-1">
        <RadioButton label="Disabled" disabled onChange={() => undefined} />
        <span className="text-secondary text-xs">Disabled</span>
      </div>
      <div className="flex flex-col gap-1">
        <RadioButton
          label="Disabled selected"
          checked
          disabled
          onChange={() => undefined}
        />
        <span className="text-secondary text-xs">Disabled + checked</span>
      </div>
    </div>
  ),
};

export const Group = {
  render: () => {
    const options = ["For", "Against", "Abstain"];
    return (
      <div className="flex flex-col gap-3">
        {options.map((option, i) => (
          <RadioButton
            key={option}
            label={option}
            name="vote"
            value={option.toLowerCase()}
            checked={i === 0}
            onChange={() => undefined}
          />
        ))}
      </div>
    );
  },
};
