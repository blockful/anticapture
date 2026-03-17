import figma from "@figma/code-connect";

import { ModalFooter } from "@/shared/components/design-system/modal/modal-footer/ModalFooter";

const cancelLabelProp = "cancelLabel";
const confirmLabelProp = "confirmLabel";

// Connect ModalFooter to the Figma component set (node 14960-53541)
figma.connect(
  ModalFooter,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=14960-53541",
  {
    props: {
      cancelLabel: figma.string(cancelLabelProp),
      confirmLabel: figma.string(confirmLabelProp),
    },
    example: ({ cancelLabel, confirmLabel }) => (
      <ModalFooter
        cancelLabel={cancelLabel ?? "Cancel"}
        confirmLabel={confirmLabel}
      />
    ),
  },
);
