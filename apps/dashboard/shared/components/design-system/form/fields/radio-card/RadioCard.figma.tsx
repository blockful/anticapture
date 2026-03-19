import figma from "@figma/code-connect";

import { RadioCard } from "@/shared/components/design-system/form/fields/radio-card/RadioCard";

figma.connect(
  RadioCard,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=16447-130123",
  {
    props: {
      label: figma.string("label"),
      hasIcon: figma.boolean("hasIcon"),
      isRadioRight: figma.boolean("isRadioRight"),
      isSelected: figma.enum("status", {
        active: true,
        default: false,
        hover: false,
        disabled: false,
      }),
      disabled: figma.enum("status", {
        active: false,
        default: false,
        hover: false,
        disabled: true,
      }),
    },
    example: ({ label, hasIcon, isRadioRight, isSelected, disabled }) => (
      <RadioCard
        label={label}
        hasIcon={hasIcon}
        isRadioRight={isRadioRight}
        isSelected={isSelected}
        disabled={disabled}
      />
    ),
  },
);
