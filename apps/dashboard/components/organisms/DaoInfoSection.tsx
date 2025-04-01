"use client";

import Image from "next/image";
import {
  CrownIcon,
  TokensIcon,
  DaoInfoDropdown,
  FocusIcon,
} from "@/components/atoms";
import { QuorumCard, TimelockCard, VoteCard } from "@/components/molecules";
import { FilePenLine, LinkIcon } from "lucide-react";
import { DaoIdEnum } from "@/lib/types/daos";
import daoConstantsByDaoId from "@/lib/dao-constants";
import { openEtherscanAddress } from "@/lib/utils/openEtherscanAddress";

export const DaoInfoSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const daoConstants = daoConstantsByDaoId[daoId];

  if (daoConstants.inAnalysis) {
    return null;
  }

  const onChainOptions = [
    {
      value: "Governor",
      icon: <CrownIcon className="text-tangerine" />,
      onClick: () => openEtherscanAddress(daoConstants.contracts.governor),
    },
    {
      value: "Token",
      icon: <TokensIcon className="text-tangerine" />,
      onClick: () => openEtherscanAddress(daoConstants.contracts.token),
    },
  ];

  const offChainOptions = [
    {
      value: "Snapshot",
      icon: <FocusIcon className="text-tangerine" />,
      onClick: () =>
        window.open(daoConstants.snapshot, "_blank", "noopener,noreferrer"),
    },
    {
      value: "Token",
      icon: <TokensIcon className="text-tangerine" />,
      onClick: () => openEtherscanAddress(daoConstants.contracts.token),
    },
  ];

  // const DaoInfo = () => {
  //   return (
  //     <div className="grid w-full gap-2 text-white md:grid-cols-2 xl:gap-4">
  //       <ContractsCard daoConstants={daoConstants} />
  //       <SecurityCouncilCard daoConstants={daoConstants} />
  //     </div>
  //   );
  // };

  return (
    <section className="flex h-full w-full flex-col gap-4 rounded-md px-4 pb-8 pt-10 sm:gap-0 sm:border sm:border-lightDark sm:bg-dark sm:px-0 sm:pb-0 sm:pt-0">
      <div id="dao-info-header" className="hidden gap-3.5 p-4 sm:flex sm:gap-5">
        <div className="flex">
          <Image
            className="rounded-full"
            src={daoConstants.icon}
            alt={"OK"}
            width={72}
            height={72}
            objectFit="contain"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="text-[24px] font-semibold leading-8 text-[#FAFAFA]">
              {daoConstants.name}
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
          <Image
            className="rounded-full"
            src={daoConstants.icon}
            alt={"OK"}
            width={36}
            height={36}
          />
          <h2 className="text-[24px] font-semibold leading-8 text-[#FAFAFA]">
            {daoConstants.name}
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
      <div className="border border-lightDark" />
      <div
        id="dao-info-cards"
        className="flex w-full flex-col gap-2 p-0 sm:flex-row sm:border-t sm:border-lightDark sm:p-2"
      >
        <div className="flex w-full sm:border-r sm:border-lightDark">
          <VoteCard daoConstants={daoConstants} />
        </div>
        <div className="w-full border-b border-lightDark" />

        <div className="flex w-full sm:border-r sm:border-lightDark">
          <TimelockCard daoConstants={daoConstants} />
        </div>
        <div className="w-full border-b border-lightDark" />

        <div className="flex w-full">
          <QuorumCard />
        </div>
        <div className="w-full border-b border-lightDark" />
      </div>
    </section>
  );
};
