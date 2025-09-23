"use client";

import { cn } from "@/shared/utils";
import { GetProposalQuery } from "@anticapture/graphql-client";
import { useState } from "react";

export const VotesTabContent = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  const [activeTab, setActiveTab] = useState<"voted" | "didntVote">("voted");

  console.log(proposal);
  return (
    <div className="text-primary w-full p-4">
      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => setActiveTab("voted")}
          className={cn(
            "border-default text-secondary border-border-default font-roboto-mono flex w-full cursor-pointer items-center justify-between border p-4 px-3 py-2 text-[13px] font-medium uppercase not-italic leading-[20px] tracking-[0.78px]",
            activeTab === "voted" && "text-link border-link",
          )}
        >
          Voted
          <div className="text-secondary font-inter text-[12px] font-medium not-italic leading-[16px]">
            32 voters / 1.2M VP (76%)
          </div>
        </div>
        <div
          onClick={() => setActiveTab("didntVote")}
          className={cn(
            "border-default text-secondary border-border-default font-roboto-mono flex w-full cursor-pointer items-center justify-between border p-4 px-3 py-2 text-[13px] font-medium uppercase not-italic leading-[20px] tracking-[0.78px]",
            activeTab === "didntVote" && "text-link border-link",
          )}
        >
          Didn&apos;t vote
          <div className="text-secondary font-inter text-[12px] font-medium not-italic leading-[16px]">
            32 voters / 1.2M VP (76%)
          </div>
        </div>
      </div>
    </div>
  );
};
