import figma from "@figma/code-connect";
import { Zap } from "lucide-react";

import { BadgeIcon } from "@/shared/components/design-system/badges/badge-icon/BadgeIcon";

figma.connect(
  BadgeIcon,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=11222-54092",
  {
    props: {
      variant: figma.enum("variant", {
        Primary: "primary",
        Secondary: "secondary",
        Error: "error",
        Outline: "outline",
        Dimmed: "dimmed",
        Warning: "warning",
        Success: "success",
      }),
      size: figma.enum("size", {
        Default: "default",
        LG: "lg",
      }),
    },
    example: ({ variant, size }) => (
      <BadgeIcon icon={Zap} variant={variant} size={size} />
    ),
  },
);
