import figma from "@figma/code-connect";

import { CardTitle } from "@/shared/components/design-system/cards/card-title/CardTitle";

figma.connect(
  CardTitle,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=11222-40214",
  {
    props: {
      text: figma.string("text"),
      isSmall: figma.enum("isSmall", { true: true, false: false }),
      hasIcon: figma.enum("hasIcon", { true: true, false: false }),
    },
    example: ({ text, isSmall, hasIcon }) => (
      <CardTitle text={text} isSmall={isSmall} hasIcon={hasIcon} />
    ),
  },
);
