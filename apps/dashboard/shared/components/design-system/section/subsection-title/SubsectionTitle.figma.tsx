import figma from "@figma/code-connect";

import { SubsectionTitle } from "@/shared/components/design-system/section/subsection-title/SubsectionTitle";

figma.connect(
  SubsectionTitle,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=11508-25396",
  {
    props: {
      subsectionTitle: figma.string("title"),
      subsectionDescription: figma.string("description"),
      dateRange: figma.string("dateRange"),
    },
    example: ({ subsectionTitle, subsectionDescription, dateRange }) => (
      <SubsectionTitle
        subsectionTitle={subsectionTitle}
        subsectionDescription={subsectionDescription}
        dateRange={dateRange}
        switcherComponent={null}
      />
    ),
  },
);
