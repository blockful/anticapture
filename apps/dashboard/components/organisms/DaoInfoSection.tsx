"use client";

import Image from "next/image";
import {
  CrownIcon,
  TokensIcon,
  DaoInfoDropdown,
  FocusIcon,
} from "@/components/atoms";
import {
  ContractsCard,
  QuorumCard,
  SecurityCouncilCard,
  TimelockCard,
  VoteCard,
} from "@/components/molecules";
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

  const DaoInfo = () => {
    return (
      <div className="grid w-full gap-2 text-white md:grid-cols-2 xl:gap-4">
        <ContractsCard daoConstants={daoConstants} />
        <SecurityCouncilCard daoConstants={daoConstants} />
      </div>
    );
  };

  return (
    <section className="flex h-full w-full flex-col rounded-md border border-lightDark bg-dark px-4 pb-8 pt-10 sm:px-0 sm:pb-0 sm:pt-0">
      <div id="dao-info-header" className="flex gap-3.5 p-4 sm:gap-5">
        <div className="flex">
          <Image
            className="overflow-hidden rounded-full"
            src={daoConstants.icon}
            alt={"OK"}
            width={72}
            height={72}
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
      <div
        id="dao-info-cards"
        className="flex w-full gap-2 border-t border-lightDark p-2"
      >
        <div className="flex w-full border-r border-lightDark">
          <VoteCard daoConstants={daoConstants} />
        </div>

        <div className="flex w-full border-r border-lightDark">
          <TimelockCard daoConstants={daoConstants} />
        </div>
        <div className="flex w-full">
          <QuorumCard />
        </div>
      </div>
    </section>
  );
};
