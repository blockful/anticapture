"use client";

import { ReactElement, useState } from "react";
import { TheSectionLayout, SwitcherDate } from "@/shared/components";
import { TimeInterval } from "@/shared/types/enums";
import { DaoIdEnum } from "@/shared/types/daos";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { UserCheck } from "lucide-react";
import {
  TokenHolders,
  Delegates,
} from "@/features/holders-and-delegates/components";
import { TabButton } from "@/features/holders-and-delegates/components/TabButton";

type TabId = "tokenHolders" | "delegates";

export const HoldersAndDelegatesSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const defaultDays = TimeInterval.ONE_YEAR;
  const [days, setDays] = useState<TimeInterval>(defaultDays);
  const [activeTab, setActiveTab] = useState<TabId>("tokenHolders");

  // Map from tab ID to tab component
  const tabComponentMap: Record<TabId, ReactElement> = {
    tokenHolders: <TokenHolders days={days} daoId={daoId} />,
    delegates: <Delegates />,
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
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.holdersAndDelegates.title}
      subtitle={"Holders & Delegates"}
      icon={<UserCheck className="section-layout-icon" />}
      description={SECTIONS_CONSTANTS.holdersAndDelegates.description}
      switchDate={
        <SwitcherDate defaultValue={defaultDays} setTimeInterval={setDays} />
      }
      days={days}
      anchorId={SECTIONS_CONSTANTS.holdersAndDelegates.anchorId}
      leftComponent={<HoldersAndDelegatesLeftComponent />}
    >
      {tabComponentMap[activeTab]}
    </TheSectionLayout>
  );
};
