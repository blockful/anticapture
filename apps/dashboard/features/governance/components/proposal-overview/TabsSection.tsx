"use client";

import { parseAsStringEnum, useQueryState } from "nuqs";

import { ActionsTabContent } from "@/features/governance/components/proposal-overview/ActionTabContent";
import { DescriptionTabContent } from "@/features/governance/components/proposal-overview/DescriptionTabContent";
import { OffchainVotesContent } from "@/features/governance/components/proposal-overview/OffchainVotesContent";
import { VotesTabContent } from "@/features/governance/components/proposal-overview/VotesTabContent";
import type { ProposalViewData } from "@/features/governance/types";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";

type TabId = "description" | "votes" | "actions";

interface TabsSectionProps {
  proposal: ProposalViewData;
  onAddressClick?: (address: string) => void;
  isOffchain?: boolean;
  offchainProposalId?: string;
  offchainChoices?: string[];
  offchainScores?: number[];
  daoId?: DaoIdEnum;
}

export const TabsSection = ({
  proposal,
  onAddressClick,
  isOffchain = false,
  offchainProposalId,
  offchainChoices = [],
  offchainScores,
  daoId,
}: TabsSectionProps) => {
  const allowedTabs: TabId[] = isOffchain
    ? ["description", "votes"]
    : ["description", "votes", "actions"];

  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringEnum<TabId>(allowedTabs).withDefault("description"),
  );

  const totalVotingPower =
    isOffchain && offchainScores
      ? offchainScores.reduce((sum, s) => sum + s, 0)
      : 0;

  const onchainProposal = proposal as NonNullable<GetProposalQuery["proposal"]>;

  const renderTabContent = () => {
    switch (activeTab) {
      case "description":
        return <DescriptionTabContent proposal={onchainProposal} />;
      case "votes":
        return isOffchain && offchainProposalId && daoId ? (
          <OffchainVotesContent
            proposalId={offchainProposalId}
            daoId={daoId}
            totalVotingPower={totalVotingPower}
            choices={offchainChoices}
          />
        ) : (
          <VotesTabContent
            proposal={onchainProposal}
            onAddressClick={onAddressClick}
          />
        );
      case "actions":
        return isOffchain ? null : (
          <ActionsTabContent proposal={onchainProposal} />
        );
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
        {!isOffchain && (
          <Tab
            isActive={activeTab === "actions"}
            onClick={() => setActiveTab("actions")}
          >
            Actions
          </Tab>
        )}
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
