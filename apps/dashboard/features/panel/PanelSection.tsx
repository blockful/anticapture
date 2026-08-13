import { LatestFindingTicker } from "@/features/panel/components/LatestFindingTicker";
import { PanelHero } from "@/features/panel/components/PanelHero";
import { PanelTable } from "@/features/panel/components/PanelTable";
import { ServicesRow } from "@/features/panel/components/ServicesRow";
import { TrackRecordSection } from "@/features/panel/components/TrackRecordSection";
import { UseItNowSection } from "@/features/panel/components/UseItNowSection";
import {
  SubSection,
  SubSectionsContainer,
} from "@/shared/components/design-system/section";

export const PanelSection = () => {
  return (
    <div className="mt-12 flex w-full flex-col gap-5 px-4 py-5 lg:mt-0 lg:gap-2 lg:p-5">
      <PanelHero />

      <LatestFindingTicker />

      <SubSectionsContainer className="gap-3">
        <SubSection
          className="gap-0"
          subsectionTitle={"Monitored DAOs"}
          dateRange=""
        >
          <PanelTable />
        </SubSection>
      </SubSectionsContainer>

      <TrackRecordSection />

      <UseItNowSection />

      <ServicesRow />
    </div>
  );
};
