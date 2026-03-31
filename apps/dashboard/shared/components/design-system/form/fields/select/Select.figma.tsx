import figma from "@figma/code-connect";

import { Select } from "@/shared/components/design-system/form/fields/select/Select";

figma.connect(
  Select,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=20768-32769",
  {
    props: {
      placeholder: figma.string("placeholder"),
      disabled: figma.enum("State", {
        Disabled: true,
        Default: false,
        Hover: false,
        Open: false,
        Error: false,
      }),
      error: figma.enum("State", {
        Error: true,
        Default: false,
        Hover: false,
        Open: false,
        Disabled: false,
      }),
    },
    example: ({ placeholder, disabled, error }) => (
      <Select
        items={[
          { value: "item-1", label: "Option 1" },
          { value: "item-2", label: "Option 2" },
          { value: "item-3", label: "Option 3" },
        ]}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        onValueChange={(value) => console.log(value)}
      />
    ),
  },
);
