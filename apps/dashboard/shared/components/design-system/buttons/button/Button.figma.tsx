import figma from "@figma/code-connect";

import { Button } from "@/shared/components/design-system/buttons/button/Button";

figma.connect(
  Button,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=1-72",
  {
    props: {
      variant: figma.enum("hierarchy", {
        primary: "primary",
        outline: "outline",
        ghost: "ghost",
        destructive: "destructive",
      }),
      size: figma.enum("size", {
        sm: "sm",
        default: "md",
        lg: "lg",
      }),
      disabled: figma.enum("state", {
        disabled: true,
        default: false,
        hover: false,
      }),
      children: figma.string("label"),
    },
    example: ({ variant, size, disabled, children }) => (
      <Button variant={variant} size={size} disabled={disabled}>
        {children}
      </Button>
    ),
  },
);
