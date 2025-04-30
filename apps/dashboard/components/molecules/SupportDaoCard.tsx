"use client";

import { Card } from "@/components/ui/card";
import { formatNumberUserReadable, formatPlural } from "@/lib/client/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import { TrendingUpIcon } from "@/components/atoms";
import { ChevronRight, TrendingUp } from "lucide-react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { usePetitionSignatures } from "@/hooks/usePetition";
import { ReactNode } from "react";

export const SupportDaoCard = ({
  daoIcon,
  daoName,
  daoId,
  onClick,
  userSupport: externalUserSupport,
  votingPowerSupport: externalVotingPowerSupport,
  totalCountSupport: externalTotalCountSupport,
}: {
  daoIcon: ReactNode;
  daoName: string;
  daoId: DaoIdEnum;
  onClick: () => void;
  userSupport?: boolean;
  votingPowerSupport?: number;
  totalCountSupport?: number;
}) => {
  // Get petition data internally if not provided externally
  const { address } = useAccount();
  const { data: petitionData } = usePetitionSignatures(daoId, address);

  // Use external data if provided, otherwise use petition data
  const userSupport =
    externalUserSupport !== undefined
      ? externalUserSupport
      : petitionData?.userSigned || false;

  const totalCountSupport =
    externalTotalCountSupport !== undefined
      ? externalTotalCountSupport
      : petitionData?.totalSignatures || 0;

  const votingPowerSupport =
    externalVotingPowerSupport !== undefined
      ? externalVotingPowerSupport
      : Number(formatEther(BigInt(petitionData?.totalSignaturesPower || 0)));

  const supportersInfo = (
    <div className="text-xs text-gray-400">
      <div className="flex flex-col items-center gap-1 md:flex-row">
        {votingPowerSupport > 0 && (
          <div className="flex flex-row items-center gap-2">
            <TrendingUpIcon className="text-brandLightGreen h-4 w-4" />
            <div className="text-brandLightGreen">
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
              <TrendingUp className="size-4 text-success" />
              <p className="text-sm font-normal text-success">
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
      className="flex w-full flex-row rounded-md border border-lightDark bg-dark p-3 shadow hover:cursor-pointer hover:bg-lightDark md:w-[calc(50%-10px)] xl4k:max-w-full"
      onClick={onClick}
    >
      <div className="flex w-full flex-row justify-between gap-2">
        <div className="flex items-center gap-2">
          {daoIcon}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-small truncate text-center text-white">
                {daoName}
              </h3>
              <div
                className={`mx-2 w-fit rounded-full bg-lightDark px-2 py-1 ${!userSupport && "hidden"}`}
              >
                <p className="text-xs text-white">Supported</p>
              </div>
            </div>
            <div className="flex justify-start sm:hidden">{supportersInfo}</div>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <div className="hidden sm:flex">{supportersInfo}</div>
          <div className="flex flex-row items-center p-2">
            <ChevronRight className="size-4 text-foreground" />
          </div>
        </div>
      </div>
    </Card>
  );
};
