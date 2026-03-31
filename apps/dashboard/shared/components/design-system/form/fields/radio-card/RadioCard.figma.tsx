import { CheckCircle2 } from "lucide-react";
import figma from "@figma/code-connect";

import { RadioCard } from "@/shared/components/design-system/form/fields/radio-card/RadioCard";

figma.connect(
  RadioCard,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=16447-130123",
  {
    props: {
      label: figma.string("label"),
      hasIcon: figma.boolean("hasIcon"),
      placementRight: figma.boolean("isRadioRight"),
      isActive: figma.enum("status", {
        active: true,
        default: false,
        hover: false,
        disabled: false,
      }),
      isDisabled: figma.enum("status", {
        active: false,
        default: false,
        hover: false,
        disabled: true,
      }),
    },
    example: ({ label, hasIcon, placementRight, isActive, isDisabled }) => (
      <RadioCard
        label={label}
        icon={
          hasIcon ? <CheckCircle2 className="size-3.5 shrink-0" /> : undefined
        }
        placementRight={placementRight}
        isActive={isActive}
        isDisabled={isDisabled}
      />
    ),
  },
);
