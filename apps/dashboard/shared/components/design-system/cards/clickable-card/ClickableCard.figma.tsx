import figma from "@figma/code-connect";

import { ClickableCard } from "@/shared/components/design-system/cards/clickable-card/ClickableCard";

figma.connect(
  ClickableCard,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=21632-1110",
  {
    props: {
      disabled: figma.enum("status", {
        default: false,
        hover: false,
        disabled: true,
      }),
    },
    example: ({ disabled }) => (
      <ClickableCard
        title="Card Title"
        subtitle="October, 2024"
        disabled={disabled}
      />
    ),
  },
);
