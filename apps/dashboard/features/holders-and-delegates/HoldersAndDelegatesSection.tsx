"use client";

import { UserCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import type { ReactElement } from "react";

import { Delegates } from "@/features/holders-and-delegates/components";
import { TokenHolders } from "@/features/holders-and-delegates/token-holder";
import { PillTabGroup } from "@/shared/components/design-system/tabs/pill-tab-group/PillTabGroup";
import { TheSectionLayout } from "@/shared/components";
import { SubSectionsContainer } from "@/shared/components/design-system/section";
import { SwitcherDateMobile } from "@/shared/components/switchers/SwitcherDateMobile";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import type { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { getWhitelabelBasePath } from "@/shared/utils/whitelabel";

type TabId = "tokenHolders" | "delegates";

const NORMAL_TABS = [
  { value: "tokenHolders", label: "Token Holders" },
  { value: "delegates", label: "Delegates" },
];

const WHITELABEL_TABS = [
  { value: "delegates", label: "Delegates" },
  { value: "tokenHolders", label: "Token Holders" },
];

export const HoldersAndDelegatesSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const pathname = usePathname();
  const isWhitelabel = Boolean(getWhitelabelBasePath({ daoId, pathname }));

  const defaultDays = TimeInterval.NINETY_DAYS;
  const [days, setDays] = useQueryState(
    "days",
    parseAsStringEnum(Object.values(TimeInterval)).withDefault(defaultDays),
  );
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault(isWhitelabel ? "delegates" : "tokenHolders"),
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

  const TABS = isWhitelabel ? WHITELABEL_TABS : NORMAL_TABS;

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
            <PillTabGroup
              tabs={TABS}
              activeTab={activeTab ?? "tokenHolders"}
              onTabChange={(value) => handleTabChange(value as TabId)}
            />
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
