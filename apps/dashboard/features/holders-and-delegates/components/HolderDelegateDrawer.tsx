"use client";
import { Drawer, DrawerContent } from "@/shared/components/ui/drawer";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Button } from "@/shared/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/shared/utils";
import { ReactNode, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";

export type EntityType = "delegate" | "tokenHolder";

interface HolderDelegateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  address: string;
  entityData?: {
    votingPower?: string;
    delegators?: number;
    type?: string;
  };
}

export const HolderDelegateDrawer = ({
  isOpen,
  onClose,
  entityType,
  address,
  entityData,
}: HolderDelegateDrawerProps) => {
  const tabs = {
    delegate: [
      { id: "votes", label: "Votes", content: <>Votes</> },
      { id: "votingPower", label: "Voting Power", content: <>Voting Power</> },
      {
        id: "delegationHistory",
        label: "Delegation History",
        content: <>Delegation History</>,
      },
    ],
    tokenHolder: [
      {
        id: "delegationHistory",
        label: "Delegation History",
        content: <>Delegation History</>,
      },
      {
        id: "balanceHistory",
        label: "Balance History",
        content: <>Balance History</>,
      },
    ],
  };

  const [activeTab, setActiveTab] = useState(tabs[entityType][0].id);

  const renderTabContent = (tabId: string) => {
    return tabs[entityType].find((tab) => tab.id === tabId)?.content;
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent>
        <div className="bg-surface-default h-full w-full">
          <div className="bg-surface-contrast h-[100px] w-full">
            {/* Header */}
            <div className="bg-surface-contrast flex justify-between px-4 pt-4 pb-0">
              <div className="flex flex-col gap-1">
                {/* Title */}
                <div className="text-secondary font-mono text-xs font-medium tracking-wide uppercase">
                  {entityType === "delegate" ? "Delegate" : "Token Holder"}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <EnsAvatar
                    address={address as `0x${string}`}
                    size="sm"
                    variant="rounded"
                  />

                  {/* Address/ENS Name */}
                  <div className="text-primary text-md font-medium">
                    {address}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="bg-surface-default hover:bg-surface-contrast border-middle-dark size-8 border p-0"
              >
                <X className="text-primary size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <Tabs
              defaultValue={tabs[entityType][0].id}
              value={activeTab}
              onValueChange={(tabId) => setActiveTab(tabId)}
              className="w-fit min-w-full"
            >
              <TabsList className="group flex border-b border-b-white/10 pl-4">
                {tabs[entityType].map((tab) => (
                  <TabsTrigger
                    className={cn(
                      "text-secondary relative cursor-pointer gap-2 px-2 py-3 text-xs font-medium whitespace-nowrap",
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
