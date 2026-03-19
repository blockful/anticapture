import figma from "@figma/code-connect";

import { BulletDivider } from "@/shared/components/design-system/section/bullet-divider/BulletDivider";

figma.connect(
  BulletDivider,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=11304-19660",
  {
    example: () => <BulletDivider />,
  },
);
