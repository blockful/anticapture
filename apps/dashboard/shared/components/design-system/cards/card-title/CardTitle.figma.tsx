import { CheckCircle2 } from "lucide-react";
import figma from "@figma/code-connect";

import { CardTitle } from "@/shared/components/design-system/cards/card-title/CardTitle";

figma.connect(
  CardTitle,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=11222-40214",
  {
    props: {
      text: figma.string("text"),
      size: figma.enum("size", { small: "small", default: "default" }),
      hasIcon: figma.boolean("hasIcon"),
    },
    example: ({ text, size, hasIcon }) => (
      <CardTitle
        text={text}
        size={size}
        icon={
          hasIcon ? (
            <CheckCircle2 className="text-secondary size-4 shrink-0" />
          ) : undefined
        }
      />
    ),
  },
);
