import figma from "@figma/code-connect";

import { DrawerBody } from "@/shared/components/design-system/drawer/drawer-body/DrawerBody";

figma.connect(
  DrawerBody,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=22016-174",
  {
    example: () => (
      <DrawerBody>
        <div>Place the content here</div>
      </DrawerBody>
    ),
  },
);
