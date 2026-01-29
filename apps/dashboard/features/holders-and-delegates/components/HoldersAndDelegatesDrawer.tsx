"use client";

import { Drawer, DrawerContent } from "@/shared/components/ui/drawer";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { X } from "lucide-react";
import { cn } from "@/shared/utils";
import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useScreenSize } from "@/shared/hooks";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { DelegateDelegationsHistory } from "@/features/holders-and-delegates/delegate/drawer/delegation-history/DelegateDelegationsHistory";
import { DaoIdEnum } from "@/shared/types/daos";
import { VotingPower } from "@/features/holders-and-delegates/delegate/drawer/voting-power/VotingPower";
import { BalanceHistory } from "@/features/holders-and-delegates/token-holder/drawer/balance-history/BalanceHistory";
import { DelegationHistoryTable } from "@/features/holders-and-delegates/token-holder/drawer/delegation-history/DelegationHistoryTable";
import { DelegateProposalsActivity } from "@/features/holders-and-delegates/delegate/drawer/votes/DelegateProposalsActivity";
import { IconButton } from "@/shared/components";
import { TopInteractions } from "@/features/holders-and-delegates/token-holder/drawer/top-interactions/TopInteractions";
import { parseAsString, useQueryState, useQueryStates } from "nuqs";

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
          id: "votingPower",
          label: "Vote Composition",
          content: <VotingPower address={address} daoId={daoId} />,
        },
        {
          id: "delegationHistory",
          label: "Voting Power History",
          content: (
            <DelegateDelegationsHistory accountId={address} daoId={daoId} />
          ),
        },
      ],
    },
    tokenHolder: {
      title: "Token Holder",
      tabs: [
        {
          id: "delegationHistory",
          label: "Delegation History",
          content: <DelegationHistoryTable address={address} daoId={daoId} />,
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

  const { isMobile } = useScreenSize();

  const renderTabContent = (tabId: string) => {
    return entities[entityType].tabs.find((tab) => tab.id === tabId)?.content;
  };

  const handleCloseDrawer = () => {
    onClose();
    setActiveTab(null);
    cleanupFilters();
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={handleCloseDrawer}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerContent>
        <div className="bg-surface-default h-full w-full overflow-y-auto">
          <div className="bg-surface-contrast w-full">
            {/* Header */}
            <div className="bg-surface-contrast flex justify-between px-4 pb-2 pt-4">
              <div className="flex flex-col gap-1">
                {/* Title */}
                <div className="text-secondary font-mono text-xs font-medium uppercase tracking-wide">
                  {entities[entityType].title}
                </div>
                <div className="flex items-center justify-center gap-2">
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
                </div>
              </div>

              <IconButton
                variant="outline"
                size="sm"
                onClick={handleCloseDrawer}
                icon={X}
              />
            </div>
            <Tabs
              defaultValue={entities[entityType].tabs[0].id}
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-fit min-w-full"
            >
              <TabsList className="group flex border-b border-b-white/10 pl-4">
                {entities[entityType].tabs.map((tab) => (
                  <TabsTrigger
                    className={cn(
                      "text-secondary relative cursor-pointer gap-2 whitespace-nowrap px-2 py-2 text-xs font-medium",
                      "data-[state=active]:text-link",
                      "after:absolute after:-bottom-px after:left-0 after:right-0 after:h-px after:bg-transparent after:content-['']",
                      "data-[state=active]:after:bg-surface-solid-brand",
                    )}
                    key={tab.id}
                    value={tab.id}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          {renderTabContent(activeTab)}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
