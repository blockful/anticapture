import type { Meta, StoryObj } from "@storybook/nextjs";

import { PillTab } from "@/shared/components/design-system/tabs/pill-tab/PillTab";
import type { PillTabProps } from "@/shared/components/design-system/tabs/types";

type PillTabStoryArgs = PillTabProps & { showCounter?: boolean };

const meta: Meta<PillTabStoryArgs> = {
  title: "Design System/Tabs/PillTab",
  component: PillTab,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=10682-13924",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Tab label text (rendered uppercase)",
    },
    isActive: {
      control: "boolean",
      description: "Whether this tab is currently selected",
    },
    counter: {
      control: "object",
      description:
        "Optional counter data shown below the label (voters, VP, percentage)",
    },
    showCounter: {
      control: "boolean",
      description:
        "Toggle counter visibility across all states (AllStates story)",
    },
  },
};

export default meta;
type Story = StoryObj<PillTabStoryArgs>;

export const Default: Story = {
  args: {
    label: "Proposals",
    isActive: false,
    counter: undefined,
  },
};

const sampleCounter = { voters: "9.1K", vp: "1.2M VP", percentage: "76%" };

export const AllStates: Story = {
  args: {
    showCounter: false,
  },
  render: ({ showCounter }) => (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center gap-2">
        <span className="text-secondary text-xs">Inactive</span>
        <PillTab
          label="Proposals"
          isActive={false}
          counter={showCounter ? sampleCounter : undefined}
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-secondary text-xs">Active</span>
        <PillTab
          label="Proposals"
          isActive={true}
          counter={showCounter ? sampleCounter : undefined}
        />
      </div>
    </div>
  ),
};
