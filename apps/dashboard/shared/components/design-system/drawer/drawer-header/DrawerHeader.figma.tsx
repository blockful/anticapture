import figma from "@figma/code-connect";

import { DrawerHeader } from "@/shared/components/design-system/drawer/drawer-header/DrawerHeader";

figma.connect(
  DrawerHeader,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=10752-17019",
  {
    props: {
      title: figma.string("title"),
      subtitle: figma.string("subtitle"),
    },
    example: ({ title, subtitle }) => (
      <DrawerHeader
        title={title}
        subtitle={subtitle}
        onClose={() => undefined}
      />
    ),
  },
);
