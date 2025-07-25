"use client";

import { useAccount } from "wagmi";

import { Card } from "@/shared/components/ui/card";
import { formatPlural } from "@/shared/utils";
import { DaoIdEnum } from "@/shared/types/daos";
import { ChevronRight, TrendingUp } from "lucide-react";
import { formatEther } from "viem";
import { usePetitionSignatures } from "@/features/show-support/hooks/usePetition";
import { ReactNode } from "react";
import { formatNumberUserReadable } from "@/shared/utils";

export const SupportDaoCard = ({
  daoIcon,
  daoName,
  daoId,
  onClick,
}: {
  daoIcon: ReactNode;
  daoName: string;
  daoId: DaoIdEnum;
  onClick: () => void;
}) => {
  const { address } = useAccount();
  const { signatures: petitionData } = usePetitionSignatures(
    daoId.toUpperCase() as DaoIdEnum,
    address,
  );

  const userSupport = petitionData?.userSigned;
  const totalCountSupport = petitionData?.totalSignatures || 0;
  const votingPowerSupport = Number(
    formatEther(BigInt(petitionData?.totalSignaturesPower || 0)),
  );

  const supportersInfo = (
    <div className="text-xs text-gray-400">
      <div className="flex flex-col items-start gap-1 md:flex-row md:items-center">
        {votingPowerSupport > 0 && (
          <div className="flex flex-row items-center gap-2">
            <TrendingUp className="text-success size-4" />
            <div className="text-success">
              {formatNumberUserReadable(votingPowerSupport)} {daoId}
            </div>
          </div>
        )}
        <div className="hidden md:inline">
          {votingPowerSupport > 0 && totalCountSupport > 0 ? "|" : ""}
        </div>
        <div className="flex flex-row gap-1 text-gray-400">
          {totalCountSupport > 0 && (
            <div className="flex flex-row items-center gap-1.5">
              <TrendingUp className="text-success size-4" />
              <p className="text-success text-sm font-normal">
                {formatPlural(totalCountSupport, "supporter")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card
      className="border-light-dark bg-surface-default hover:bg-surface-contrast flex w-full flex-row rounded-md border p-3 shadow-sm hover:cursor-pointer"
      onClick={onClick}
    >
      <div className="flex h-full w-full flex-row justify-between gap-2">
        <div className="flex items-center gap-2">
          {daoIcon}
          <div className="flex flex-col sm:gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-primary truncate text-center text-sm font-medium">
                {daoName}
              </h3>
              <div
                className={`bg-surface-contrast mx-2 w-fit rounded-full px-2 py-1 ${!userSupport && "hidden"}`}
              >
                <p className="text-primary text-xs">Supported</p>
              </div>
            </div>
            <div className="flex justify-start sm:hidden">{supportersInfo}</div>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <div className="hidden sm:flex">{supportersInfo}</div>
          <div className="flex flex-row items-center p-2">
            <ChevronRight className="text-secondary size-4" />
          </div>
        </div>
      </div>
    </Card>
  );
};
