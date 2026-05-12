import { BarChart4 } from "lucide-react";

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

export const PanelSection = () => {
  return (
    <TheSectionLayout
      title={PAGES_CONSTANTS.panel.title}
      icon={<BarChart4 className="section-layout-icon" />}
      description={PAGES_CONSTANTS.panel.description}
      className="mt-12 lg:mt-0 lg:min-h-0"
    >
      <div className="flex flex-col gap-8 lg:h-full lg:min-h-0 lg:flex-1 lg:gap-2">
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
    </TheSectionLayout>
  );
};
