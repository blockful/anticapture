"use client";

import { Suspense } from "react";

import { parseAsStringEnum, useQueryState } from "nuqs";

import { TabButton } from "@/features/holders-and-delegates/components/TabButton";
import { TokenHolders } from "@/features/holders-and-delegates/token-holder";
import { Footer } from "@/shared/components/design-system/footer";
import { SwitcherDate } from "@/shared/components";
import { ReportPanelButton } from "@/shared/components/report/ReportPanelButton";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { HeaderDAOSidebar, HeaderSidebar, StickyPageHeader } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

import { DelegationTable } from "@/app/aave/stakeholders/DelegationTable";
import { TheSectionLayout } from "@/shared/components/containers/TheSectionLayout";
import { SubSectionsContainer } from "@/shared/components/design-system/section";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { UserCheck } from "lucide-react";

type TabId = "delegates" | "tokenHolders";

const TABS: { id: TabId; label: string }[] = [
  { id: "tokenHolders", label: "TOKEN HOLDERS" },
  { id: "delegates", label: "DELEGATES" },
];

function AavePageContent() {
  const defaultDays = TimeInterval.NINETY_DAYS;
  const [days, setDays] = useQueryState(
    "days",
    parseAsStringEnum(Object.values(TimeInterval)).withDefault(defaultDays),
  );
  // Enum parsed like the shared section: a stale `?tab=foo` would otherwise
  // render Delegates with neither tab button highlighted.
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringEnum<TabId>(["tokenHolders", "delegates"]).withDefault(
      "delegates",
    ),
  );

  const setDrawerAddress = useQueryState("drawerAddress")[1];
  const setCurrentAddressFilter = useQueryState("address")[1];
  const setSortOrder = useQueryState("sort")[1];
  const setSortBy = useQueryState("sortBy")[1];
  const setMinValue = useQueryState("minValue")[1];
  const setMaxValue = useQueryState("maxValue")[1];

  const cleanupFilters = () => {
    setDrawerAddress(null);
    setCurrentAddressFilter(null);
    setSortOrder(null);
    setSortBy(null);
    setMinValue(null);
    setMaxValue(null);
  };

  const handleTabChange = (tab: TabId) => {
    cleanupFilters();
    setActiveTab(tab);
  };

  return (
    <div className="bg-surface-background dark relative mx-auto flex h-screen max-w-screen-2xl">
      <div className="active relative hidden h-screen lg:flex">
        <div className="w-17 h-full shrink-0 overflow-y-auto">
          <HeaderSidebar />
        </div>
        <div className="h-full shrink-0">
          <HeaderDAOSidebar />
        </div>
      </div>
      <main className="h-screen flex-1 overflow-auto">
        <div className="lg:hidden">
          <HeaderMobile />
          <StickyPageHeader withMobileMenu={false} />
        </div>
        <div className="flex w-full flex-col items-center lg:h-screen">
          <div className="w-full flex-1">
            <TheSectionLayout
              title={PAGES_CONSTANTS.holdersAndDelegates.title}
              icon={<UserCheck className="section-layout-icon" />}
              description={PAGES_CONSTANTS.holdersAndDelegates.description}
            >
              <SubSectionsContainer>
                <div className="flex w-full items-center justify-between">
                  <div className="flex gap-2">
                    {TABS.map((tab) => (
                      <TabButton
                        key={tab.id}
                        id={tab.id}
                        label={tab.label}
                        activeTab={activeTab}
                        setActiveTab={handleTabChange}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <SwitcherDate
                      defaultValue={days || defaultDays}
                      setTimeInterval={setDays}
                    />
                    <ReportPanelButton
                      panel={
                        activeTab === "delegates"
                          ? "Delegates"
                          : "Token Holders"
                      }
                    />
                  </div>
                </div>
                {activeTab === "delegates" ? (
                  <DelegationTable days={days || defaultDays} />
                ) : (
                  <TokenHolders
                    days={days || defaultDays}
                    daoId={DaoIdEnum.AAVE}
                    showTokenName={false}
                  />
                )}
              </SubSectionsContainer>
            </TheSectionLayout>
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}

export const AaveStakeholders = () => (
  <Suspense>
    <AavePageContent />
  </Suspense>
);
