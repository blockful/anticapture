import figma from "@figma/code-connect";

import { Combobox } from "@/shared/components/design-system/combobox/Combobox";

// Connect Combobox to the Figma Combobox container component set
figma.connect(
  Combobox,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=11197-22067",
  {
    props: {
      items: figma.enum("items", {
        "2": [
          { value: "item-1", label: "Item" },
          { value: "item-2", label: "Item" },
        ],
        "3": [
          { value: "item-1", label: "Item" },
          { value: "item-2", label: "Item" },
          { value: "item-3", label: "Item" },
        ],
        "4": [
          { value: "item-1", label: "Item" },
          { value: "item-2", label: "Item" },
          { value: "item-3", label: "Item" },
          { value: "item-4", label: "Item" },
        ],
      }),
    },
    example: ({ items }) => (
      <Combobox
        items={items}
        placeholder="Select…"
        onValueChange={(value) => console.log(value)}
      />
    ),
  },
);
