import figma from "@figma/code-connect";

import { SubSection } from "@/shared/components/design-system/section/sub-section/SubSection";
import { SubSectionsContainer } from "@/shared/components/design-system/section/subsections-container/SubSectionsContainer";

figma.connect(
  SubSectionsContainer,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=10339-58558",
  {
    example: () => (
      <SubSectionsContainer>
        <SubSection subsectionTitle="Section title" dateRange="Jan – Dec 2024">
          <div>Place the content here</div>
        </SubSection>
      </SubSectionsContainer>
    ),
  },
);
