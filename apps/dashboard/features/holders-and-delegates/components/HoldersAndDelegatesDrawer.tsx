"use client";

import { Drawer, DrawerContent } from "@/shared/components/ui/drawer";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Button } from "@/shared/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/shared/utils";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useScreenSize } from "@/shared/hooks";
import { DelegationHistoryTable } from "@/features/holders-and-delegates/token-holder/drawer";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { BalanceHistory } from "./BalanceHistory";
import { DelegateDelegationHistory } from "./DelegateDelegationHistory";
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
        { id: "votes", label: "Votes", content: <>Votes</> },
        {
          id: "votingPower",
          label: "Voting Power",
          content: <>Voting Power</>,
        },
        {
          id: "delegationHistory",
          label: "Delegation History",
          content: (
            <DelegateDelegationHistory accountId={address} daoId={daoId} />
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
          id: "balanceHistory",
          label: "Balance History",
          content: <BalanceHistory accountId={address} daoId={daoId} />,
        },
      ],
    },
  };

  const [activeTab, setActiveTab] = useState(entities[entityType].tabs[0].id);

  const { isMobile } = useScreenSize();

  const renderTabContent = (tabId: string) => {
    return entities[entityType].tabs.find((tab) => tab.id === tabId)?.content;
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={onClose}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerContent>
        <div className="bg-surface-default h-full w-full">
          <div className="bg-surface-contrast w-full">
            {/* Header */}
            <div className="bg-surface-contrast flex justify-between px-4 pt-4 pb-2">
              <div className="flex flex-col gap-1">
                {/* Title */}
                <div className="text-secondary font-mono text-xs font-medium tracking-wide uppercase">
                  {entities[entityType].title}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <EnsAvatar
                    address={address as `0x${string}`}
                    size="sm"
                    variant="rounded"
                    nameClassName="text-lg leading-[18px]"
                    containerClassName="gap-2"
                  />
                  <CopyAndPasteButton textToCopy={address as `0x${string}`} />
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="bg-surface-default hover:bg-surface-contrast border-middle-dark size-7 border p-0"
              >
                <X className="text-primary size-3" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <Tabs
              defaultValue={entities[entityType].tabs[0].id}
              value={activeTab}
              onValueChange={(tabId) => setActiveTab(tabId)}
              className="w-fit min-w-full"
            >
              <TabsList className="group flex border-b border-b-white/10 pl-4">
                {entities[entityType].tabs.map((tab) => (
                  <TabsTrigger
                    className={cn(
                      "text-secondary relative cursor-pointer gap-2 px-2 py-2 text-xs font-medium whitespace-nowrap",
                      "data-[state=active]:text-link",
                      "after:absolute after:right-0 after:-bottom-px after:left-0 after:h-px after:bg-transparent after:content-['']",
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
