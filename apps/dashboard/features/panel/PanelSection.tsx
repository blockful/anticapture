import { PanelHero } from "@/features/panel/components/PanelHero";
import { PanelTable } from "@/features/panel/components/PanelTable";
import {
  SubSection,
  SubSectionsContainer,
} from "@/shared/components/design-system/section";

export const PanelSection = () => {
  return (
    <div className="mt-12 flex h-full w-full flex-col gap-5 px-4 py-5 lg:mt-0 lg:min-h-0 lg:gap-2 lg:p-5">
      <PanelHero />

      <SubSectionsContainer className="gap-3 lg:min-h-0 lg:flex-1">
        <SubSection
          className="gap-0"
          subsectionTitle={"Monitored DAOs"}
          dateRange=""
          contentClassName="lg:flex lg:flex-col lg:flex-1 lg:min-h-0"
        >
          <PanelTable />
        </SubSection>
      </SubSectionsContainer>
    </div>
  );
};
