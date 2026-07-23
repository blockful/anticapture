"use client";

import { UserCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactElement } from "react";
import { useMemo } from "react";

import { Delegates } from "@/features/holders-and-delegates/components";
import { TokenHolders } from "@/features/holders-and-delegates/token-holder";
import { PillTabGroup } from "@/shared/components/design-system/tabs/pill-tab-group/PillTabGroup";
import { TheSectionLayout } from "@/shared/components";
import { SubSectionsContainer } from "@/shared/components/design-system/section";
import {
  CUSTOM_PERIOD,
  MAX_PERIOD,
  SwitcherDateRange,
} from "@/shared/components/switchers/SwitcherDateRange";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";
import type { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import {
  getWhitelabelBasePath,
  isWhitelabelDao,
} from "@/shared/utils/whitelabel";
import daoConfigByDaoId from "@/shared/dao-config";

type TabId = "tokenHolders" | "delegates";

const TABS = [
  { value: "delegates", label: "Delegates" },
  { value: "tokenHolders", label: "Token Holders" },
];

const DAY_IN_SECONDS = 24 * 60 * 60;

const parseDateParam = (value: string | null): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const toDateParam = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const HoldersAndDelegatesSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const pathname = usePathname();
  const basePath = getWhitelabelBasePath({ daoId, pathname });
  const isWhitelabel =
    basePath.startsWith("/whitelabel/") ||
    (basePath === "" && isWhitelabelDao(daoConfigByDaoId[daoId]));

  const defaultDays = TimeInterval.NINETY_DAYS;
  const [days, setDays] = useQueryState(
    "days",
    parseAsString.withDefault(defaultDays),
  );
  const [fromParam, setFromParam] = useQueryState("from");
  const [toParam, setToParam] = useQueryState("to");
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault("delegates"),
  );

  // clean up filters when switching tabs
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

  const customRange = useMemo(
    () => ({
      from: parseDateParam(fromParam),
      to: parseDateParam(toParam),
    }),
    [fromParam, toParam],
  );

  const { fromDate, toDate } = useMemo(() => {
    if (days === MAX_PERIOD) return { fromDate: undefined, toDate: undefined };
    if (days === CUSTOM_PERIOD && customRange.from && customRange.to) {
      return {
        fromDate: Math.floor(customRange.from.getTime() / 1000),
        // include the whole end day
        toDate:
          Math.floor(customRange.to.getTime() / 1000) + DAY_IN_SECONDS - 1,
      };
    }
    const interval = (Object.values(TimeInterval) as string[]).includes(days)
      ? (days as TimeInterval)
      : defaultDays;
    return {
      fromDate: Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[interval],
      toDate: undefined,
    };
  }, [days, customRange, defaultDays]);

  // Map from tab ID to tab component
  const tabs = TABS;
  const defaultTab = "delegates";

  const tabComponentMap: Record<TabId, ReactElement> = {
    tokenHolders: (
      <TokenHolders daoId={daoId} fromDate={fromDate} toDate={toDate} />
    ),
    delegates: (
      <Delegates
        daoId={daoId}
        fromDate={fromDate}
        toDate={toDate}
        isWhitelabel={isWhitelabel}
      />
    ),
  };

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
              tabs={tabs}
              activeTab={activeTab ?? defaultTab}
              onTabChange={(value) => handleTabChange(value as TabId)}
            />
            <SwitcherDateRange
              selected={days}
              onSelectPeriod={(period) => {
                setFromParam(null);
                setToParam(null);
                setDays(period);
              }}
              customRange={customRange}
              onSelectCustomRange={({ from, to }) => {
                setFromParam(toDateParam(from));
                setToParam(toDateParam(to));
                setDays(CUSTOM_PERIOD);
              }}
            />
          </div>
          {tabComponentMap[activeTab as TabId]}
        </SubSectionsContainer>
      </TheSectionLayout>
    </div>
  );
};
