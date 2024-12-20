"use client";

import { UsersIcon, TooltipInfo } from "@/components/01-atoms";
import { formatNumberUserReadble } from "@/lib/client/utils";
import { DAO } from "@/lib/server/backend";
import { formatEther } from "viem";

export const QuorumCard = ({ daoData }: { daoData: DAO }) => {
  const quorumMinPercentage =
    daoData &&
    formatEther(
      (BigInt(daoData.quorum) * BigInt(1e20)) / BigInt(daoData.totalSupply),
    );

  const proposalThresholdPercentage =
    daoData &&
    formatEther(
      (BigInt(daoData.proposalThreshold) * BigInt(1e20)) /
        BigInt(daoData.totalSupply),
    );

  return (
    <div className="card-container-about">
      <div className="card-header-about">
        <UsersIcon />
        <h1 className="card-header-about-text">Quorum</h1>
      </div>
      <div className="card-body-about">
        <div className="flex h-full w-full gap-4">
          <div className="card-description-about">
            <div className="card-description-title">
              <h1 className="text-foreground">Logic</h1>
              <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
            </div>
            <div className="flex h-full w-full items-center justify-start gap-1.5">
              <div className="flex w-full">
                <p className="flex text-sm font-medium leading-tight">For</p>
              </div>
            </div>
          </div>
          <div className="card-description-about">
            <div className="card-description-title">
              <h1 className="text-foreground">Quorum</h1>
              <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
            </div>
            <div className="flex h-full w-full items-center justify-start gap-1.5">
              <div className="flex w-full">
                <p className="flex text-sm font-medium leading-tight">
                  {formatNumberUserReadble(
                    Number(daoData.quorum) / Number(10 ** 18),
                  ).toString()}{" "}
                  {daoData.id} {"(" + quorumMinPercentage.toString() + "%)"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card-description-about">
          <div className="card-description-title">
            <h1 className="text-foreground">Proposal threshold</h1>
            <TooltipInfo text="Direct liquid profit: Cost of direct capture" />
          </div>
          <div className="flex h-full w-full items-center justify-start gap-1.5">
            <div className="flex w-1/2">
              <p className="flex text-sm font-medium leading-tight">
                {formatNumberUserReadble(
                  Number(daoData.proposalThreshold) / Number(10 ** 18),
                ).toString()}{" "}
                {daoData.id}{" "}
                {"(" + proposalThresholdPercentage.toString() + "%)"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
