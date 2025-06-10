"use client";

import { useState } from "react";
import { TheSectionLayout, SwitcherDate } from "@/shared/components";
import { TimeInterval } from "@/shared/types/enums";
import { DaoIdEnum } from "@/shared/types/daos";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { cn } from "@/shared/utils";

import { UserCheck } from "lucide-react";
import {
  TokenHolders,
  Delegates,
} from "@/features/holders-and-delegates/components";

type TabId = "tokenHolders" | "delegates";

export const HoldersAndDelegatesSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const defaultDays = TimeInterval.ONE_YEAR;
  const [days, setDays] = useState<TimeInterval>(defaultDays);
  const [activeTab, setActiveTab] = useState<TabId>("tokenHolders");

  // Map from tab ID to tab component
  const tabComponentMap: Record<TabId, React.ReactElement> = {
    tokenHolders: <TokenHolders />,
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
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "cursor-pointer border-2 px-3 py-2 font-mono text-[13px] leading-5 font-medium tracking-[0.78px] uppercase transition-all",
                activeTab === tab.id
                  ? "border-[#EC762E] bg-transparent text-[#EC762E]"
                  : "border-[#3F3F46] bg-transparent text-[#3F3F46] hover:border-gray-500 hover:text-gray-500",
              )}
            >
              {tab.label}
            </button>
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
