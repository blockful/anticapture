"use client";

import {
  CrownIcon,
  TokensIcon,
  DaoInfoDropdown,
  DaoLogoIcon,
  DaoLogoVariant,
  FocusIcon,
} from "@/components/atoms";
import {
  QuorumCard,
  SecurityCouncilCard,
  TimelockCard,
  VoteCard,
} from "@/components/molecules";
import { FilePenLine, LinkIcon } from "lucide-react";
import { DaoIdEnum } from "@/lib/types/daos";
import { openEtherscanAddress } from "@/lib/utils/openEtherscanAddress";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import daoConfigByDaoId from "@/lib/dao-config";
import { Address } from "viem";

export const DaoInfoSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const daoConfig = daoConfigByDaoId[daoId];
  const daoInfo = daoConfig.daoInfo;

  if (!daoInfo) {
    return null;
  }

  const onChainOptions = [
    {
      value: "Governor",
      icon: <CrownIcon className="text-tangerine" />,
      onClick: () =>
        openEtherscanAddress(daoInfo?.contracts?.governor as Address),
    },
    {
      value: "Token",
      icon: <TokensIcon className="text-tangerine" />,
      onClick: () =>
        openEtherscanAddress(daoInfo?.contracts?.token as Address),
    },
  ];

  const offChainOptions = [
    {
      value: "Snapshot",
      icon: <FocusIcon className="text-tangerine" />,
      onClick: () =>
        window.open(daoInfo?.snapshot as string, "_blank", "noopener,noreferrer"),
    },
    {
      value: "Token",
      icon: <TokensIcon className="text-tangerine" />,
      onClick: () => openEtherscanAddress(daoInfo?.contracts?.token as Address),
    },
  ];

  return (
    <section
      id={SECTIONS_CONSTANTS.daoInfo.anchorId}
      className="flex h-full w-full flex-col gap-4 rounded-md px-4 pb-8 pt-10 sm:gap-0 sm:border sm:border-lightDark sm:bg-dark sm:px-0 sm:pb-0 sm:pt-0"
    >
      <div id="dao-info-header" className="hidden gap-3.5 p-4 sm:flex sm:gap-5">
        <div className="flex">
          <DaoLogoIcon
            daoId={daoId}
            className="size-[72px] rounded-full"
            variant={DaoLogoVariant.DEFAULT}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="text-[24px] font-semibold leading-8 text-[#FAFAFA]">
              {daoConfig.name}
            </h2>
          </div>
          <div className="flex gap-2">
            <DaoInfoDropdown
              defaultValue={{
                value: "OnChain Gov",
                icon: <LinkIcon className="size-3.5 text-[#FAFAFA]" />,
                onClick: () => {},
              }}
              options={onChainOptions}
            />
            <DaoInfoDropdown
              defaultValue={{
                value: "OffChain Gov",
                icon: <FilePenLine className="size-3.5 text-[#FAFAFA]" />,
                onClick: () => {},
              }}
              options={offChainOptions}
            />
          </div>
        </div>
      </div>
      <div id="dao-info-header" className="flex flex-col gap-3.5 sm:hidden">
        <div className="flex items-center gap-3">
          <DaoLogoIcon
            daoId={daoId}
            className="size-8 rounded-full"
            variant={DaoLogoVariant.DEFAULT}
          />
          <h2 className="text-[24px] font-semibold leading-8 text-[#FAFAFA]">
            {daoConfig.name}
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <DaoInfoDropdown
              defaultValue={{
                value: "OnChain Gov",
                icon: <LinkIcon className="size-3.5 text-[#FAFAFA]" />,
                onClick: () => {},
              }}
              options={onChainOptions}
            />
            <DaoInfoDropdown
              defaultValue={{
                value: "OffChain Gov",
                icon: <FilePenLine className="size-3.5 text-[#FAFAFA]" />,
                onClick: () => {},
              }}
              options={offChainOptions}
            />
          </div>
        </div>
      </div>
      <div className="flex h-full w-full">
        <SecurityCouncilCard
          daoInfo={daoInfo}
        />
      </div>
      <div className="border border-lightDark sm:hidden" />
      <div
        id="dao-info-cards"
        className="flex w-full flex-col gap-2 p-0 sm:flex-row sm:border-t sm:border-lightDark sm:p-2"
      >
        <div className="flex w-full sm:border-r sm:border-lightDark">
          <VoteCard daoInfo={daoInfo} />
        </div>
        <div className="w-full border-b border-lightDark sm:hidden" />

        <div className="flex w-full sm:border-r sm:border-lightDark">
          <TimelockCard daoInfo={daoInfo} />
        </div>
        <div className="w-full border-b border-lightDark sm:hidden" />

        <div className="flex w-full">
          <QuorumCard />
        </div>
        <div className="w-full border-b border-lightDark sm:hidden" />
      </div>
    </section>
  );
};
