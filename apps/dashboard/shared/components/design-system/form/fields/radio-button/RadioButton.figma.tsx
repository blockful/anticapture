import figma from "@figma/code-connect";

import { RadioButton } from "@/shared/components/design-system/form/fields/radio-button/RadioButton";

figma.connect(
  RadioButton,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=13-1660",
  {
    props: {
      label: figma.string("label"),
      checked: figma.enum("State", {
        Selected: true,
        Default: false,
        Hover: false,
        Disabled: false,
      }),
      disabled: figma.enum("State", {
        Disabled: true,
        Default: false,
        Hover: false,
        Selected: false,
      }),
    },
    example: ({ label, checked, disabled }) => (
      <RadioButton
        label={label}
        checked={checked}
        disabled={disabled}
        onChange={() => undefined}
      />
    ),
  },
);
