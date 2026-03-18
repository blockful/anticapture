import figma from "@figma/code-connect";

import { PillTab } from "@/shared/components/design-system/tabs/pill-tab/PillTab";
import type { PillTabCounter } from "@/shared/components/design-system/tabs/types";

figma.connect(
  PillTab,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=10682-13924",
  {
    props: {
      label: figma.string("label"),
      isActive: figma.enum("status", {
        active: true,
        inactive: false,
        hover: false,
      }),
      counter: figma.enum("hasCounter", {
        true: {
          voters: "9.1K",
          vp: "1.2M VP",
          percentage: "76%",
        } as PillTabCounter,
        false: undefined,
      }),
    },
    example: ({ label, isActive, counter }) => (
      <PillTab label={label} isActive={isActive} counter={counter} />
    ),
  },
);
