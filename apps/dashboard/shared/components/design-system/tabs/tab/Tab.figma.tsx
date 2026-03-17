import figma from "@figma/code-connect";

import { Tab } from "@/shared/components/design-system/tabs/tab/Tab";

// Connect Tab to Figma Tab component set (node 7673-37546 contains both size variants)
figma.connect(
  Tab,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=7673-37546",
  {
    props: {
      label: figma.string("label"),
      isActive: figma.enum("status", {
        Active: true,
        Default: false,
        Hover: false,
      }),
      size: figma.enum("isSmall", {
        true: "sm",
        false: "md",
      }),
      badge: figma.enum("hasBadge", {
        true: 1,
        false: undefined,
      }),
    },
    example: ({ label, isActive, size, badge }) => (
      <Tab label={label} isActive={isActive} size={size} badge={badge} />
    ),
  },
);
