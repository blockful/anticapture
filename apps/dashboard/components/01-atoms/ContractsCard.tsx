"use client";

import {
  CrownIcon,
  TokensIcon,
  NewspaperIcon,
  FocusIcon,
} from "@/components/01-atoms";
import { DaoConstants } from "@/lib/dao-constants/types";
import { openEtherscanAddress } from "@/lib/utils/openEtherscanAddress";
import { BaseCardDao, CardData } from "./BaseCardDao";

export const ContractsCard = ({
  daoConstants,
}: {
  daoConstants: DaoConstants;
}) => {
  const contractsData: CardData = {
    title: "Contracts",
    icon: <NewspaperIcon />,
    sections: [
      {
        title: "Onchain Gov",
        tooltip: "Governança descentralizada na blockchain",
        items: [
          {
            type: "button",
            label: "Governor",
            icon: <CrownIcon />,
            onClick: () =>
              openEtherscanAddress(daoConstants.contracts.governor),
          },
          {
            type: "button",
            label: "Token",
            icon: <TokensIcon />,
            onClick: () => openEtherscanAddress(daoConstants.contracts.token),
          },
        ],
      },
      {
        title: "OffChain Gov",
        tooltip: "Governança offchain via Snapshot",
        items: [
          {
            type: "button",
            label: "Snapshot",
            icon: <FocusIcon />,
            externalLink: daoConstants.snapshot,
          },
          {
            type: "button",
            label: "Token",
            icon: <TokensIcon />,
            onClick: () => openEtherscanAddress(daoConstants.contracts.token),
          },
        ],
      },
    ],
  };

  return <BaseCardDao data={contractsData} />;
};
