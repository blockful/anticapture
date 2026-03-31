import figma from "@figma/code-connect";

import { PillTabGroup } from "@/shared/components/design-system/tabs/pill-tab-group/PillTabGroup";

figma.connect(
  PillTabGroup,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=11059-11258",
  {
    example: () => (
      <PillTabGroup
        tabs={[
          { label: "Proposals", value: "proposals" },
          { label: "Votes", value: "votes" },
          { label: "Delegates", value: "delegates" },
        ]}
        activeTab="proposals"
        onTabChange={(value) => console.log(value)}
      />
    ),
  },
);
