import figma from "@figma/code-connect";

import { SubSection } from "@/shared/components/design-system/section/sub-section/SubSection";

figma.connect(
  SubSection,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=10339-58558",
  {
    props: {
      subsectionTitle: figma.string("title"),
      dateRange: figma.string("dateRange"),
    },
    example: ({ subsectionTitle, dateRange }) => (
      <SubSection subsectionTitle={subsectionTitle} dateRange={dateRange}>
        <div>Place the content here</div>
      </SubSection>
    ),
  },
);
