"use client";

import { Suspense } from "react";

import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

import { TabButton } from "@/features/holders-and-delegates/components/TabButton";
import { TokenHolders } from "@/features/holders-and-delegates/token-holder";
import { Footer } from "@/shared/components/design-system/footer";
import { SwitcherDateMobile } from "@/shared/components/switchers/SwitcherDateMobile";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { HeaderDAOSidebar, HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

import { DelegationTable } from "@/app/aave/holders-and-delegates/DelegationTable";
import { TheSectionLayout } from "@/shared/components/containers/TheSectionLayout";
import { SubSectionsContainer } from "@/shared/components/design-system/section";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { UserCheck } from "lucide-react";

type TabId = "delegates" | "tokenHolders";

const TABS: { id: TabId; label: string }[] = [
  { id: "tokenHolders", label: "TOKEN HOLDERS" },
  { id: "delegates", label: "DELEGATES" },
];

const AavePageContent = () => {
  const defaultDays = TimeInterval.NINETY_DAYS;
  const [days, setDays] = useQueryState(
    "days",
    parseAsStringEnum(Object.values(TimeInterval)).withDefault(defaultDays),
  );
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault("tokenHolders"),
  );

  const setDrawerAddress = useQueryState("drawerAddress")[1];
  const setCurrentAddressFilter = useQueryState("address")[1];
  const setSortOrder = useQueryState("sort")[1];
  const setSortBy = useQueryState("sortBy")[1];

  const cleanupFilters = () => {
    setDrawerAddress(null);
    setCurrentAddressFilter(null);
    setSortOrder(null);
    setSortBy(null);
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
      <main className="flex h-screen flex-1 flex-col overflow-hidden">
        <div className="lg:hidden">
          <HeaderMobile overlayClassName="top-[57px]" />
        </div>
        <TheSectionLayout
          title={PAGES_CONSTANTS.holdersAndDelegates.title}
          subtitle={"Holders & Delegates"}
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
                    activeTab={activeTab as TabId}
                    setActiveTab={handleTabChange}
                  />
                ))}
              </div>
              <SwitcherDateMobile
                defaultValue={days || defaultDays}
                setTimeInterval={setDays}
              />
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
        <Footer />
      </main>
    </div>
  );
};

const AavePage = () => {
  return (
    <Suspense>
      <AavePageContent />
    </Suspense>
  );
};

export default AavePage;
