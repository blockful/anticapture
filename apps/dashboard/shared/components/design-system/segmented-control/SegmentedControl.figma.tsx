import figma from "@figma/code-connect";

import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";

// Connect SegmentedControl to Figma component set (node 6492-10373)
figma.connect(
  SegmentedControl,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=6492-10373",
  {
    props: {
      size: figma.enum("isSmall", {
        true: "sm",
        false: "md",
      }),
    },
    example: ({ size }) => (
      <SegmentedControl
        size={size}
        items={[
          { label: "Selected", value: "item-1" },
          { label: "Selected", value: "item-2" },
          { label: "Selected", value: "item-3" },
        ]}
        value="item-1"
        onValueChange={(value) => console.log(value)}
      />
    ),
  },
);
