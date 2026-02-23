import {
  PanelTable,
  DelegatedSupplyHistory,
  DaoProtectionLevels,
  TreasuryMonitoring,
} from "@/features/panel/components";
import { TheSectionLayout } from "@/shared/components";
import { Carousel } from "@/shared/components/design-system/carousel/Carousel";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import {
  SubSection,
  SubSectionsContainer,
} from "@/shared/components/design-system/section";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { BarChart4 } from "lucide-react";

export const PanelSection = () => {
  return (
    <TheSectionLayout
      title={PAGES_CONSTANTS.panel.title}
      icon={<BarChart4 className="section-layout-icon" />}
      description={PAGES_CONSTANTS.panel.description}
      className="mt-14 lg:mt-0"
    >
      <div className="flex flex-col gap-8 lg:gap-2">
        <div className="lg:hidden">
          <Carousel
            slides={[
              <DaoProtectionLevels />,
              <TreasuryMonitoring />,
              <DelegatedSupplyHistory />,
            ]}
          />
        </div>
        <div className="hidden gap-2 lg:grid lg:grid-cols-3">
          <DaoProtectionLevels />
          <TreasuryMonitoring />
          <DelegatedSupplyHistory />
        </div>

        <div className="block lg:hidden">
          <DividerDefault isHorizontal />
        </div>

        <SubSectionsContainer className="gap-3">
          <SubSection
            className="gap-0"
            subsectionTitle={"Monitored DAOs"}
            dateRange=""
          >
            <PanelTable />
          </SubSection>
        </SubSectionsContainer>
      </div>
    </TheSectionLayout>
  );
};
