"use client";

import { ReactElement } from "react";
import { TheSectionLayout } from "@/shared/components";
import { TimeInterval } from "@/shared/types/enums";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { UserCheck } from "lucide-react";
import { Delegates } from "@/features/holders-and-delegates/components";
import { TabButton } from "@/features/holders-and-delegates/components/TabButton";
import { DaoIdEnum } from "@/shared/types/daos";
import { TokenHolders } from "@/features/holders-and-delegates/token-holder";
import { SubSectionsContainer } from "@/shared/components/design-system/section";
import { SwitcherDateMobile } from "@/shared/components/switchers/SwitcherDateMobile";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

type TabId = "tokenHolders" | "delegates";

export const HoldersAndDelegatesSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const defaultDays = TimeInterval.ONE_YEAR;
  const [days, setDays] = useQueryState(
    "days",
    parseAsStringEnum(Object.values(TimeInterval)).withDefault(defaultDays),
  );
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault("tokenHolders"),
  );

  // Map from tab ID to tab component
  const tabComponentMap: Record<TabId, ReactElement> = {
    tokenHolders: <TokenHolders days={days || defaultDays} daoId={daoId} />,
    delegates: <Delegates daoId={daoId} timePeriod={days || defaultDays} />,
  };

  const HoldersAndDelegatesLeftComponent = () => {
    const tabs: Array<{ id: TabId; label: string }> = [
      {
        id: "tokenHolders",
        label: "TOKEN HOLDERS",
      },
      {
        id: "delegates",
        label: "DELEGATES",
      },
    ];

    return (
      <div className="flex h-full w-full items-center justify-between">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              activeTab={activeTab as TabId}
              setActiveTab={setActiveTab}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <TheSectionLayout
      title={PAGES_CONSTANTS.holdersAndDelegates.title}
      subtitle={"Holders & Delegates"}
      icon={<UserCheck className="section-layout-icon" />}
      description={PAGES_CONSTANTS.holdersAndDelegates.description}
    >
      <SubSectionsContainer>
        <div className="flex h-full w-full items-center justify-between">
          <HoldersAndDelegatesLeftComponent />
          <SwitcherDateMobile
            defaultValue={defaultDays}
            setTimeInterval={setDays}
          />
        </div>
        {tabComponentMap[activeTab as TabId]}
      </SubSectionsContainer>
    </TheSectionLayout>
  );
};
