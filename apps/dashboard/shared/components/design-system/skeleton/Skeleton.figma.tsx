import figma from "@figma/code-connect";

import { Skeleton } from "@/shared/components/design-system/skeleton/Skeleton";

figma.connect(
  Skeleton,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=168-2123",
  {
    props: {
      shape: figma.enum("shape", {
        Rectangle: "rectangle",
        Circle: "circle",
        Text: "text",
      }),
    },
    example: ({ shape }) => <Skeleton shape={shape} className="h-10 w-32" />,
  },
);
