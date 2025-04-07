"use client";

import {
  BaseCardDaoInfo,
  ButtonCardDaoInfoItem,
  CardData,
  CrownIcon,
  FocusIcon,
  NewspaperIcon,
  TokensIcon,
} from "@/components/atoms";
import { DaoInfoConfig } from "@/lib/dao-config/types";
import { openEtherscanAddress } from "@/lib/utils/openEtherscanAddress";

export const ContractsCard = ({
  contracts, 
}: {
  contracts: DaoInfoConfig["contracts"];
}) => {
  if (!contracts) {
    return null;
  }
  const contractsData: CardData = {
    title: "Contracts",
    icon: <NewspaperIcon />,
    sections: [
      {
        title: "Onchain Gov",
        tooltip:
          "On-chain governance relies on smart contracts that only execute transactions approved by on-chain votes. Voting power is determined by delegated tokens, and the Governor contract oversees both the voting process and proposal approvals.",
        items: [
          <ButtonCardDaoInfoItem
            key="governor"
            label="Governor"
            icon={<CrownIcon className="text-tangerine" />}
            onClick={() =>
              openEtherscanAddress(contracts.governor)
            }
          />,
          <ButtonCardDaoInfoItem
            key="token"
            label="Token"
            icon={<TokensIcon className="text-tangerine" />}
            onClick={() => openEtherscanAddress(contracts.token)}
          />,
        ],
      },
      {
        title: "Offchain Gov",
        tooltip:
          "Off-chain governance—often done through Snapshot—allows token holders to vote without on-chain transactions. Voting power is calculated using token-based strategies, but any decisions require additional on-chain steps by DAO members to be enacted.",
        items: [
          <ButtonCardDaoInfoItem
            key="Snapshot"
            label="Snapshot"
            icon={<FocusIcon className="text-tangerine" />}
            onClick={() =>
              window.open(
                `${daoInfo.snapshot}`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          />,
          <ButtonCardDaoInfoItem
            key="Token"
            label="Token"
            icon={<TokensIcon className="text-tangerine" />}
            onClick={() => openEtherscanAddress(contracts.token)}
          />,
        ],
      },
    ],
  };

  return <BaseCardDaoInfo data={contractsData} />;
};
