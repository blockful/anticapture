"use client";

import Image, { StaticImageData } from "next/image";
import { Card } from "@/components/ui/card";
import { formatNumberUserReadable } from "@/lib/client/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import { TrendingUpIcon } from "@/components/atoms";
import { ChevronRight } from "lucide-react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { usePetitionSignatures } from "@/hooks/usePetition";

export const SupportDaoCard = ({
  daoIcon,
  daoName,
  daoId,
  onClick,
  userSupport: externalUserSupport,
  votingPowerSupport: externalVotingPowerSupport,
  totalCountSupport: externalTotalCountSupport,
}: {
  daoIcon: StaticImageData;
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
        {votingPowerSupport && votingPowerSupport > 0 ? (
          <div className="flex flex-row items-center gap-2">
            <TrendingUpIcon className="text-brandLightGreen h-4 w-4" />
            <div className="text-brandLightGreen">
              {formatNumberUserReadable(votingPowerSupport)} {daoId}
            </div>
          </div>
        ) : (
          ""
        )}
        <div className="hidden md:inline">
          {votingPowerSupport &&
          votingPowerSupport > 0 &&
          totalCountSupport &&
          totalCountSupport > 0
            ? "|"
            : ""}
        </div>
        <div className="flex flex-row gap-1">
          {totalCountSupport && totalCountSupport > 0 ? (
            <div className="text-gray-400">{totalCountSupport} </div>
          ) : (
            ""
          )}
          {!votingPowerSupport && !totalCountSupport
            ? ""
            : totalCountSupport === 1
              ? "supporter"
              : "supporters"}
        </div>
      </div>
    </div>
  );

  return (
    <Card
      className="flex w-full flex-row rounded-lg border border-lightDark bg-dark px-4 py-3 shadow hover:cursor-pointer hover:bg-lightDark md:w-[calc(50%-10px)] xl4k:max-w-full"
      onClick={onClick}
    >
      <div className="flex w-full flex-row justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full overflow-hidden">
            <Image
              src={daoIcon}
              alt={daoName}
              width={36}
              height={36}
              className="flex-shrink-0"
            />
          </div>
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
            <div className="flex sm:hidden justify-start">{supportersInfo}</div>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <div className="hidden sm:flex">{supportersInfo}</div>
          <ChevronRight className="h-4 w-4 text-white/60" />
        </div>
      </div>
    </Card>
  );
};
