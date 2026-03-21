import figma from "@figma/code-connect";

import {
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@/shared/components/design-system/drawer";

figma.connect(
  DrawerRoot,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=10752-16973",
  {
    props: {
      title: figma.string("title"),
    },
    example: ({ title }) => (
      <DrawerRoot open onOpenChange={() => undefined}>
        <DrawerContent>
          <DrawerHeader title={title} onClose={() => undefined} />
          <DrawerBody>
            <div>Place the content here</div>
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>
    ),
  },
);
