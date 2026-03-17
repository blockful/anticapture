import figma from "@figma/code-connect";

import { ProgressBar } from "@/shared/components/design-system/progress-bar/ProgressBar";
import type { ProgressSegment } from "@/shared/components/design-system/progress-bar/types";

figma.connect(
  ProgressBar,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=21932-7368",
  {
    props: {
      labelPosition: figma.enum("labelPosition", {
        top: "top",
        bottom: "bottom",
        left: "left",
        right: "right",
      }),
      size: figma.enum("size", {
        default: "default",
        large: "large",
      }),
      marker: figma.enum("hasMarker", {
        true: { value: 50, label: "Quorum: 1M" },
        false: undefined,
      }),
      segments: figma.enum("hasMultipleColors", {
        true: [
          { value: 33, color: "success" },
          { value: 33, color: "error" },
          { value: 34, color: "warning" },
        ] as ProgressSegment[],
        false: undefined,
      }),
    },
    example: ({ labelPosition, size, marker, segments }) => (
      <ProgressBar
        value={60}
        label="Label"
        labelPosition={labelPosition}
        size={size}
        marker={marker}
        segments={segments}
      />
    ),
  },
);
