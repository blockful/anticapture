import figma from "@figma/code-connect";

import { ModalHeader } from "@/shared/components/design-system/modal/modal-header/ModalHeader";

// Connect ModalHeader to the Figma component set (node 14960-53381)
figma.connect(
  ModalHeader,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=14960-53381",
  {
    props: {
      title: figma.string("title"),
      description: figma.string("description"),
    },
    example: ({ title, description }) => (
      <ModalHeader title={title} description={description} />
    ),
  },
);
