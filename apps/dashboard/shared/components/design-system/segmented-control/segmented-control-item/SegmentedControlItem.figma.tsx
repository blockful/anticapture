import figma from "@figma/code-connect";

import { SegmentedControlItem } from "@/shared/components/design-system/segmented-control/segmented-control-item/SegmentedControlItem";

// Connect SegmentedControlItem to Figma component set (node 6-205)
figma.connect(
  SegmentedControlItem,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=6-205",
  {
    props: {
      label: figma.string("label"),
      isActive: figma.enum("status", {
        Active: true,
        Inactive: false,
        Hover: false,
      }),
      size: figma.enum("isSmall", {
        true: "sm",
        false: "md",
      }),
      items: figma.string("badge"),
    },
    example: ({ label, isActive, size, items }) => (
      <SegmentedControlItem
        label={label}
        isActive={isActive}
        size={size}
        items={items}
      />
    ),
  },
);
