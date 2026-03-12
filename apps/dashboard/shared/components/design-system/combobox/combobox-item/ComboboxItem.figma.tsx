import figma from "@figma/code-connect";

import { ComboboxItem } from "@/shared/components/design-system/combobox/combobox-item/ComboboxItem";

// Connect ComboboxItem to the Figma ComboboxItem component set
figma.connect(
  ComboboxItem,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=7459-19867",
  {
    props: {
      label: figma.string("label"),
      hasIcon: figma.enum("hasIcon", {
        true: true,
        false: false,
      }),
      status: figma.enum("status", {
        Default: "default",
        Hover: "hover",
        Active: "active",
        Filter: "filter",
      }),
      isSelected: figma.enum("status", {
        Active: true,
        Filter: true,
        Default: false,
        Hover: false,
      }),
    },
    example: ({ label, hasIcon, status, isSelected }) => (
      <ComboboxItem
        label={label}
        hasIcon={hasIcon}
        status={status}
        isSelected={isSelected}
      />
    ),
  },
);
