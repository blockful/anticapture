"use client";

import { cn } from "@/shared/utils";
import { useState } from "react";
import { DescriptionTabContent } from "@/features/governance/components/proposal-overview/DescriptionTabContent";
import { GetProposalQuery } from "@anticapture/graphql-client";
import { ActionsTabContent } from "@/features/governance/components/proposal-overview/ActionTabContent";
import { VotesTabContent } from "@/features/governance/components/proposal-overview/VotesTabContent";

type TabId = "description" | "votes" | "actions";

interface TabsSectionProps {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}

export const TabsSection = ({ proposal }: TabsSectionProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("description");

  const ActiveTabComponent = TabToContentMap[activeTab];

  return (
    <div className="bg-surface-default flex flex-1 flex-col lg:min-w-0">
      {/* Tabs Section */}
      <div className="bg-surface-default border-border-default sticky left-0 top-[7px] z-10 flex w-full shrink-0 gap-2 border-b px-4 sm:top-[65px] lg:top-[85px]">
        <Tab
          isActive={activeTab === "description"}
          onClick={() => setActiveTab("description")}
        >
          Description
        </Tab>
        <Tab
          isActive={activeTab === "votes"}
          onClick={() => setActiveTab("votes")}
        >
          Votes
        </Tab>
        <Tab
          isActive={activeTab === "actions"}
          onClick={() => setActiveTab("actions")}
        >
          Actions
        </Tab>
      </div>

      <div className="flex-1">
        <ActiveTabComponent proposal={proposal} />
      </div>
    </div>
  );
};

interface TabProps {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

export const Tab = ({ children, isActive = false, onClick }: TabProps) => {
  return (
    <button
      className={cn(
        "text-secondary font-inter flex cursor-pointer items-center justify-center px-3 py-3 text-[14px] font-medium not-italic leading-[20px]",
        isActive && "text-link border-b-link border-b",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const TabToContentMap = {
  description: DescriptionTabContent,
  votes: VotesTabContent,
  actions: ActionsTabContent,
} as const;
