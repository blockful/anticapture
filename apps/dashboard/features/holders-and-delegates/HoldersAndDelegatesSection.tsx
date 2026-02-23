"use client";

import { UserCheck } from "lucide-react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { ReactElement } from "react";

import { Delegates } from "@/features/holders-and-delegates/components";
import { TabButton } from "@/features/holders-and-delegates/components/TabButton";
import { TokenHolders } from "@/features/holders-and-delegates/token-holder";
import { TheSectionLayout } from "@/shared/components";
import { SubSectionsContainer } from "@/shared/components/design-system/section";
import { SwitcherDateMobile } from "@/shared/components/switchers/SwitcherDateMobile";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";

type TabId = "tokenHolders" | "delegates";

interface TabConfig {
  id: TabId;
  label: string;
}

const TABS: TabConfig[] = [
  { id: "tokenHolders", label: "TOKEN HOLDERS" },
  { id: "delegates", label: "DELEGATES" },
] as const;

export const HoldersAndDelegatesSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const defaultDays = TimeInterval.NINETY_DAYS;
  const [days, setDays] = useQueryState(
    "days",
    parseAsStringEnum(Object.values(TimeInterval)).withDefault(defaultDays),
  );
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault("tokenHolders"),
  );

  // clean up filters when switching tabs
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

  // Map from tab ID to tab component
  const tabComponentMap: Record<TabId, ReactElement> = {
    tokenHolders: <TokenHolders days={days || defaultDays} daoId={daoId} />,
    delegates: <Delegates daoId={daoId} timePeriod={days || defaultDays} />,
  };

  const TabsHeader = () => (
    <div className="flex h-full w-full items-center justify-between">
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
    </div>
  );

  return (
    <div>
      <TheSectionLayout
        title={PAGES_CONSTANTS.holdersAndDelegates.title}
        subtitle={"Holders & Delegates"}
        icon={<UserCheck className="section-layout-icon" />}
        description={PAGES_CONSTANTS.holdersAndDelegates.description}
      >
        <SubSectionsContainer>
          <div className="flex w-full items-center justify-between">
            <TabsHeader />
            <SwitcherDateMobile
              defaultValue={days || defaultDays}
              setTimeInterval={setDays}
            />
          </div>
          {tabComponentMap[activeTab as TabId]}
        </SubSectionsContainer>
      </TheSectionLayout>
    </div>
  );
};
