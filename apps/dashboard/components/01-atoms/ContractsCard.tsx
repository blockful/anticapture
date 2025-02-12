"use client";

import {
  BaseCardDao,
  CardData,
  CrownIcon,
  TokensIcon,
  NewspaperIcon,
  FocusIcon,
} from "@/components/01-atoms";
import { DaoConstants } from "@/lib/dao-constants/types";
import { openEtherscanAddress } from "@/lib/utils/openEtherscanAddress";

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
        tooltip:
          "On-chain governance relies on smart contracts that only execute transactions approved by on-chain votes. Voting power is determined by delegated tokens, and the Governor contract oversees both the voting process and proposal approvals.",
        items: [
          {
            type: "button",
            label: "Governor",
            icon: <CrownIcon className="text-[#EC762E]" />,
            onClick: () =>
              openEtherscanAddress(daoConstants.contracts.governor),
          },
          {
            type: "button",
            label: "Token",
            icon: <TokensIcon className="text-[#EC762E]" />,
            onClick: () => openEtherscanAddress(daoConstants.contracts.token),
          },
        ],
      },
      {
        title: "Offchain Gov",
        tooltip:
          "Off-chain governance—often done through Snapshot—allows token holders to vote without on-chain transactions. Voting power is calculated using token-based strategies, but any decisions require additional on-chain steps by DAO members to be enacted.",
        items: [
          {
            type: "button",
            label: "Snapshot",
            icon: <FocusIcon className="text-[#EC762E]" />,
            onClick: () =>
              window.open(
                "_blank",
                `${daoConstants.snapshot}`,
                "noopener,noreferrer",
              ),
          },
          {
            type: "button",
            label: "Token",
            icon: <TokensIcon className="text-[#EC762E]" />,
            onClick: () => openEtherscanAddress(daoConstants.contracts.token),
          },
        ],
      },
    ],
  };

  return <BaseCardDao data={contractsData} />;
};
