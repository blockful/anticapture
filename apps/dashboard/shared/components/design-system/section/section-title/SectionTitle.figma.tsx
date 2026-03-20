import figma from "@figma/code-connect";
import { Shield } from "lucide-react";

import { SectionTitle } from "@/shared/components/design-system/section/section-title/SectionTitle";

figma.connect(
  SectionTitle,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=10339-58367",
  {
    props: {
      title: figma.string("title"),
      description: figma.string("description"),
    },
    example: ({ title, description }) => (
      <SectionTitle
        icon={<Shield className="text-primary size-6" />}
        title={title}
        description={description}
      />
    ),
  },
);
