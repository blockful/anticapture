import figma from "@figma/code-connect";

import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";

figma.connect(
  InlineAlert,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=9925-16932",
  {
    props: {
      variant: figma.enum("type", {
        Informative: "info",
        Warning: "warning",
        Error: "error",
      }),
      text: figma.string("text"),
    },
    example: ({ variant, text }) => (
      <InlineAlert variant={variant} text={text} />
    ),
  },
);
