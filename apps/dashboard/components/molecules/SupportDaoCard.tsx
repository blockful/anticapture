import Image, { StaticImageData } from "next/image";
import { Card } from "../ui/card";
import { formatNumberUserReadable } from "@/lib/client/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import { TrendingUpIcon } from "../atoms/icons/TrendingUpIcon";
import { ChevronRight } from "lucide-react";

export const SupportDaoCard = ({
  daoIcon,
  daoName,
  daoId,
  onClick,
  userSupport,
  votingPowerSupport,
  totalCountSupport,
}: {
  daoIcon: StaticImageData;
  daoName: string;
  daoId: DaoIdEnum;
  onClick: () => void;
  userSupport: boolean;
  votingPowerSupport: number;
  totalCountSupport: number;
}) => {
  return (
    <Card
      className="flex w-full flex-row rounded-lg border border-lightDark bg-dark px-4 py-5 shadow hover:cursor-pointer hover:bg-lightDark md:w-[calc(50%-10px)] xl4k:max-w-full"
      onClick={onClick}
    >
      <div className="flex w-full flex-row justify-between">
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex items-center gap-2">
            <Image
              src={daoIcon}
              alt={daoName}
              width={24}
              height={24}
              className="flex-shrink-0"
            />
            <h3 className="text-md font-small truncate text-center text-white">
              {daoName}
            </h3>
          </div>
          <div
            className={`mx-2 w-fit rounded-full bg-lightDark px-2 py-1 ${!userSupport && "hidden"}`}
          >
            <p className="text-xs text-white">Supported</p>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <div className="text-xs text-gray-400">
            <div className="flex flex-col items-center gap-1 md:flex-row">
              {votingPowerSupport && votingPowerSupport > 0 ? (
                <div className="flex flex-row items-center gap-2">
                  <div className="h-4 w-4">
                    <TrendingUpIcon color="#86EFAC" />
                  </div>
                  <div className="text-[#86EFAC]">
                    {formatNumberUserReadable(votingPowerSupport)} {daoId}
                  </div>
                </div>
              ) : (
                ""
              )}
              <div className="md:inline hidden">
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
          <div className="h-6 w-6">
            <ChevronRight color="rgba(255, 255, 255, 0.6)" className="h-full w-full" />
          </div>
        </div>
      </div>
    </Card>
  );
};
