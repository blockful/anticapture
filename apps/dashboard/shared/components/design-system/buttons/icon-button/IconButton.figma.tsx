import figma from "@figma/code-connect";
import { Search } from "lucide-react";

import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";

figma.connect(
  IconButton,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=1-85",
  {
    props: {
      variant: figma.enum("variant", {
        Primary: "primary",
        Outline: "outline",
        Ghost: "ghost",
        Destructive: "destructive",
      }),
      size: figma.enum("size", {
        SM: "sm",
        MD: "md",
        LG: "lg",
      }),
      disabled: figma.enum("state", {
        Disabled: true,
        Default: false,
        Hover: false,
        Active: false,
      }),
    },
    example: ({ variant, size, disabled }) => (
      <IconButton
        icon={Search}
        variant={variant}
        size={size}
        disabled={disabled}
      />
    ),
  },
);
