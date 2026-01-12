import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";

import { Checkbox } from "@/shared/components/design-system/form/fields/checkbox/Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Design System/Form/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    checked: {
      control: "boolean",
      description: "Whether the checkbox is checked",
    },
    disabled: {
      control: "boolean",
      description: "Whether the checkbox is disabled",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: {
    checked: false,
    disabled: false,
  },
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    checked: false,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <label htmlFor="terms" className="text-primary cursor-pointer text-sm">
        Accept terms and conditions
      </label>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Checkbox id="unchecked" />
        <label htmlFor="unchecked" className="text-secondary text-sm">
          Unchecked
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checked" defaultChecked />
        <label htmlFor="checked" className="text-secondary text-sm">
          Checked
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="disabled" disabled />
        <label
          htmlFor="disabled"
          className="text-secondary cursor-not-allowed text-sm opacity-50"
        >
          Disabled
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <label
          htmlFor="disabled-checked"
          className="text-secondary cursor-not-allowed text-sm opacity-50"
        >
          Disabled Checked
        </label>
      </div>
    </div>
  ),
};

export const Types: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {/* Consent */}
      <div className="flex items-start gap-2">
        <Checkbox id="delegation-consent" className="mt-0.5" />
        <label
          htmlFor="delegation-consent"
          className="text-primary cursor-pointer text-sm"
        >
          Use this component when the user needs to consent something.
        </label>
      </div>

      {/* Group */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-primary mb-2 text-sm font-medium">
          Use this component when grouping checkbox options
        </legend>
        <div className="flex items-center gap-2">
          <Checkbox id="type-core" defaultChecked />
          <label
            htmlFor="type-core"
            className="text-primary cursor-pointer text-sm"
          >
            Core proposals
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="type-treasury" defaultChecked />
          <label
            htmlFor="type-treasury"
            className="text-primary cursor-pointer text-sm"
          >
            Treasury proposals
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="type-governance" />
          <label
            htmlFor="type-governance"
            className="text-primary cursor-pointer text-sm"
          >
            Governance upgrades
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="type-other" />
          <label
            htmlFor="type-other"
            className="text-primary cursor-pointer text-sm"
          >
            Other
          </label>
        </div>
      </fieldset>
    </div>
  ),
};
