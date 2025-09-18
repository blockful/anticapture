"use client";

import { cn } from "@/shared/utils";
import { useState } from "react";

type TabId = "description" | "votes" | "actions";

export const TabsSection = () => {
  const [activeTab, setActiveTab] = useState<TabId>("description");

  return (
    <div className="bg-surface-default flex w-full flex-col">
      {/* Tabs Section */}
      <div className="border-border-default flex w-full gap-2 border-b px-4">
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

      <div>{getTabContent(activeTab)}</div>
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

const getTabContent = (tabId: TabId) => {
  switch (tabId) {
    case "description":
      return <div className="text-primary p-4">Description</div>;
    case "votes":
      return <div className="text-primary p-4">Votes</div>;
    case "actions":
      return <div className="text-primary p-4">Actions</div>;
  }
};
