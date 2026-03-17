import figma from "@figma/code-connect";
import { CheckCircle2 } from "lucide-react";

import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";

figma.connect(
  BadgeStatus,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=136-1178",
  {
    props: {
      children: figma.string("label"),
      variant: figma.enum("variant", {
        Primary: "primary",
        Secondary: "secondary",
        Error: "error",
        Outline: "outline",
        Dimmed: "dimmed",
        Warning: "warning",
        Success: "success",
      }),
    },
    example: ({ children, variant }) => (
      <BadgeStatus variant={variant} icon={CheckCircle2}>
        {children}
      </BadgeStatus>
    ),
  },
);
