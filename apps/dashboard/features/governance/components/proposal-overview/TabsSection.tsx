"use client";

import { cn } from "@/shared/utils";
import { DescriptionTabContent } from "@/features/governance/components/proposal-overview/DescriptionTabContent";
import { GetProposalQuery } from "@anticapture/graphql-client";
import { ActionsTabContent } from "@/features/governance/components/proposal-overview/ActionTabContent";
import { VotesTabContent } from "@/features/governance/components/proposal-overview/VotesTabContent";
import { parseAsStringEnum, useQueryState } from "nuqs";

type TabId = "description" | "votes" | "actions";

interface TabsSectionProps {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
  onAddressClick?: (address: string) => void;
}

export const TabsSection = ({ proposal, onAddressClick }: TabsSectionProps) => {
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringEnum<TabId>(["description", "votes", "actions"]).withDefault(
      "description",
    ),
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "description":
        return <DescriptionTabContent proposal={proposal} />;
      case "votes":
        return (
          <VotesTabContent
            proposal={proposal}
            onAddressClick={onAddressClick}
          />
        );
      case "actions":
        return <ActionsTabContent proposal={proposal} />;
    }
  };

  return (
    <div className="lg:bg-surface-default flex flex-1 flex-col lg:min-w-0">
      {/* Tabs Section */}
      <div className="border-border-default lg:bg-surface-default sticky left-0 top-[7px] z-10 flex w-full shrink-0 gap-2 border-b lg:top-[85px] lg:px-4">
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

      <div className="flex-1">{renderTabContent()}</div>
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
