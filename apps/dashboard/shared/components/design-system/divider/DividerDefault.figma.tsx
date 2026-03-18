import figma from "@figma/code-connect";

import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";

figma.connect(
  DividerDefault,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=8176-2392",
  {
    props: {
      isVertical: figma.boolean("isVertical"),
      isDashed: figma.boolean("isDashed"),
    },
    example: ({ isVertical, isDashed }) => (
      <DividerDefault isVertical={isVertical} isDashed={isDashed} />
    ),
  },
);
