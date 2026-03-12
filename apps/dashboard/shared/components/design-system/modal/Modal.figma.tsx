import figma from "@figma/code-connect";

import { Modal } from "@/shared/components/design-system/modal/Modal";

// Connect Modal to the Figma component (node 14968-53733)
figma.connect(
  Modal,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=14968-53733",
  {
    props: {
      title: figma.string("title"),
    },
    example: ({ title }) => (
      <Modal
        open
        onOpenChange={() => undefined}
        title={title}
        actionsNumber="2"
        cancelLabel="Cancel"
        confirmLabel="Confirm"
      >
        <div>Place the content here</div>
      </Modal>
    ),
  },
);
