import figma from "@figma/code-connect";

import { TabGroup } from "@/shared/components/design-system/tabs/tab-group/TabGroup";

// Connect TabGroup to Figma TabGroup component set
figma.connect(
  TabGroup,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=10748-16842",
  {
    example: () => (
      <TabGroup
        tabs={[
          { label: "Label", value: "tab-1" },
          { label: "Label", value: "tab-2" },
        ]}
        activeTab="tab-1"
        onTabChange={(value) => console.log(value)}
      />
    ),
  },
);
