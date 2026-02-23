"use client";

import { parseAsString, useQueryState, useQueryStates } from "nuqs";

import { VoteComposition } from "@/features/holders-and-delegates/delegate/drawer/vote-composition/VoteComposition";
import { DelegateProposalsActivity } from "@/features/holders-and-delegates/delegate/drawer/votes/DelegateProposalsActivity";
import { VotingPowerHistory } from "@/features/holders-and-delegates/delegate/drawer/voting-power-history/VotingPowerHistory";
import { BalanceHistory } from "@/features/holders-and-delegates/token-holder/drawer/balance-history/BalanceHistory";
import { DelegationHistory } from "@/features/holders-and-delegates/token-holder/drawer/delegation-history/DelegationHistory";
import { TopInteractions } from "@/features/holders-and-delegates/token-holder/drawer/top-interactions/TopInteractions";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import {
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
} from "@/shared/components/design-system/drawer";
import { DaoIdEnum } from "@/shared/types/daos";

export type EntityType = "delegate" | "tokenHolder";

interface HoldersAndDelegatesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  address: string;
  daoId: DaoIdEnum;
}

export const HoldersAndDelegatesDrawer = ({
  isOpen,
  onClose,
  entityType,
  address,
  daoId,
}: HoldersAndDelegatesDrawerProps) => {
  const entities = {
    delegate: {
      title: "Delegate",
      tabs: [
        {
          id: "votes",
          label: "Votes",
          content: (
            <DelegateProposalsActivity address={address} daoId={daoId} />
          ),
        },
        {
          id: "voteComposition",
          label: "Vote Composition",
          content: <VoteComposition address={address} daoId={daoId} />,
        },
        {
          id: "votingPowerHistory",
          label: "Voting Power History",
          content: <VotingPowerHistory accountId={address} daoId={daoId} />,
        },
      ],
    },
    tokenHolder: {
      title: "Token Holder",
      tabs: [
        {
          id: "delegationHistory",
          label: "Delegation History",
          content: <DelegationHistory address={address} daoId={daoId} />,
        },
        {
          id: "topInteractions",
          label: "Top Interactions",
          content: <TopInteractions address={address} daoId={daoId} />,
        },
        {
          id: "balanceHistory",
          label: "Balance History",
          content: <BalanceHistory accountId={address} daoId={daoId} />,
        },
      ],
    },
  };

  const [activeTab, setActiveTab] = useQueryState("drawerTab", {
    defaultValue: entities[entityType].tabs[0].id,
  });

  // clean up filters when switching tabs
  const setSortOrder = useQueryState("orderDirection")[1];
  const setSortBy = useQueryState("orderBy")[1];
  const setIsFilterActive = useQueryState("active")[1];
  const setFilterVariables = useQueryStates({
    minDelta: parseAsString,
    maxDelta: parseAsString,
  })[1];
  const setToFilter = useQueryState("to")[1];
  const setFromFilter = useQueryState("from")[1];
  const setSelectedPeriod = useQueryState("selectedPeriod")[1];
  const setTypeFilter = useQueryState("type")[1];
  const setTabAddress = useQueryState("tabAddress")[1];

  const cleanupFilters = () => {
    setSortOrder(null);
    setSortBy(null);
    setIsFilterActive(null);
    setFilterVariables({
      minDelta: null,
      maxDelta: null,
    });
    setToFilter(null);
    setFromFilter(null);
    setSelectedPeriod(null);
    setTypeFilter(null);
    setTabAddress(null);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    cleanupFilters();
  };

  const renderTabContent = (tabId: string) => {
    return entities[entityType].tabs.find((tab) => tab.id === tabId)?.content;
  };

  const handleCloseDrawer = () => {
    onClose();
    setActiveTab(null);
    cleanupFilters();
  };

  const titleContent = (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <EnsAvatar
          address={address as `0x${string}`}
          size="sm"
          variant="rounded"
          nameClassName="text-lg leading-[18px]"
          containerClassName="gap-2"
          showFullAddress={true}
        />
      </div>

      {/* Mobile */}
      <div className="block lg:hidden">
        <EnsAvatar
          address={address as `0x${string}`}
          size="sm"
          variant="rounded"
          nameClassName="text-lg leading-[18px]"
          containerClassName="gap-2"
          showFullAddress={false}
        />
      </div>

      <CopyAndPasteButton
        textToCopy={address as `0x${string}`}
        className="p-1"
        iconSize="md"
        customTooltipText={{
          default: "Copy address",
          copied: "Address copied!",
        }}
      />
    </>
  );

  return (
    <DrawerRoot open={isOpen} onOpenChange={handleCloseDrawer}>
      <DrawerContent>
        <DrawerHeader
          subtitle={entities[entityType].title}
          title={titleContent}
          onClose={handleCloseDrawer}
          tabs={entities[entityType].tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        <DrawerBody>{renderTabContent(activeTab)}</DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  );
};
