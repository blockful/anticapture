"use client";

import { parseAsStringEnum, useQueryState } from "nuqs";

import { ActionsTabContent } from "@/features/governance/components/proposal-overview/ActionTabContent";
import { DescriptionTabContent } from "@/features/governance/components/proposal-overview/DescriptionTabContent";
import { OffchainVotesContent } from "@/features/governance/components/proposal-overview/OffchainVotesContent";
import { VotesTabContent } from "@/features/governance/components/proposal-overview/VotesTabContent";
import { TabGroup } from "@/shared/components/design-system/tabs/tab-group/TabGroup";
import type {
  ProposalDetails,
  ProposalViewData,
} from "@/features/governance/types";
import type { DaoIdEnum } from "@/shared/types/daos";
type TabId = "description" | "votes" | "actions";

interface TabsSectionProps {
  proposal: ProposalViewData;
  onAddressClick?: (address: string) => void;
  isOffchain?: boolean;
  isWhitelabel?: boolean;
  offchainProposalId?: string;
  offchainChoices?: string[];
  offchainScores?: number[];
  daoId?: DaoIdEnum;
}

export const TabsSection = ({
  proposal,
  onAddressClick,
  isOffchain = false,
  isWhitelabel = false,
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

  const onchainProposal = proposal as unknown as ProposalDetails;

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

  const tabs = [
    { label: "Description", value: "description" },
    { label: "Votes", value: "votes" },
    ...(!isOffchain ? [{ label: "Actions", value: "actions" }] : []),
  ];

  return (
    <div className="lg:bg-surface-default flex flex-1 flex-col lg:min-w-0">
      <div
        className={`border-border-default bg-surface-background lg:bg-surface-default sticky left-0 z-10 w-full shrink-0 border-b lg:top-[85px] lg:px-4 ${isWhitelabel ? "top-0" : "top-29.5"}`}
      >
        <TabGroup
          size="md"
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(value) => setActiveTab(value as TabId)}
        />
      </div>

      <div className="flex-1">{renderTabContent()}</div>
    </div>
  );
};
