import Image, { StaticImageData } from "next/image";
import { Card } from "../ui/card";
import { formatNumberUserReadable } from "@/lib/client/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import { TrendingUpIcon } from "../atoms/icons/TrendingUpIcon";
import { ArrowLeftRight } from "../atoms";
import { ChevronRight } from "../atoms/icons/ChevronRight";

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
    <Card className="flex w-[calc(50%-10px)] flex-row rounded-lg border border-lightDark bg-dark px-4 py-6 shadow sm:max-w-full xl4k:max-w-full hover:cursor-pointer hover:bg-lightDark" onClick={onClick}>
      <div className="flex w-full flex-row justify-between">
        <div className="flex flex-row items-center">
          <div className="flex items-center gap-2">
            <Image src={daoIcon} alt={daoName} width={24} height={24} />
            <h3 className="text-md font-small pl-1 text-white">{daoName}</h3>
          </div>
          {
            <div
              className={`ml-5 w-fit rounded-full bg-lightDark px-2 py-1 ${userSupport && "hidden"}`}
            >
              <p className="text-xs text-white">Supported</p>
            </div>
          }
        </div>
        <div className="flex flex-row items-center gap-2">
          <div className="text-sm text-gray-400">
            <div className="flex flex-row items-center gap-2">
              {votingPowerSupport && votingPowerSupport > 0 && (
                <div className="flex flex-row items-center gap-2">
                  <div className="h-6 w-6">
                    <TrendingUpIcon color="#86EFAC" />
                  </div>
                  <div className="text-[#86EFAC]">
                    {formatNumberUserReadable(votingPowerSupport)} {daoId}
                  </div>
                </div>
              )}
              {votingPowerSupport &&
                votingPowerSupport > 0 &&
                totalCountSupport &&
                totalCountSupport > 0 ?
                "|" : ""}
              {totalCountSupport && totalCountSupport > 0 ? (
                <div className="text-gray-400">{totalCountSupport}{" "}</div>
              ) : ""}
              {!totalCountSupport || totalCountSupport > 1 ? "supporters" : "supporter"}
            </div>
          </div>
          <div className="h-6 w-6">
            <ChevronRight color="rgba(255, 255, 255, 0.6)" />
          </div>
        </div>
      </div>
    </Card>
  );
};
