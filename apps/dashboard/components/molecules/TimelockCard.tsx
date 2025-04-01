"use client";

import {
  BaseCardDaoInfo,
  CardData,
  LockIcon,
  SwitchCardDaoInfoItem,
  ExternalLinkIcon,
} from "@/components/atoms";
import { DaoConstantsFullySupported } from "@/lib/dao-constants/types";
import { openEtherscanAddress } from "@/lib/utils/openEtherscanAddress";

export const TimelockCard = ({
  daoConstants,
}: {
  daoConstants: DaoConstantsFullySupported;
}) => {
  const timelockData: CardData = {
    title: "Timelock",
    icon: <LockIcon className="size-4 text-foreground" />,
    sections: [
      {
        title: "Timelock",
        tooltip:
          "A Timelock contract holds the DAO's assets. The Governor contract can execute approved proposals against these assets after a specified waiting period.",
        items: [
          <SwitchCardDaoInfoItem
            switched={daoConstants.rules.timelock}
            icon={<ExternalLinkIcon className="text-foreground" />}
            onClick={() =>
              openEtherscanAddress(daoConstants.contracts.timelock)
            }
            key={"switch"}
          />,
        ],
      },
      {
        title: "Cancel Function",
        tooltip:
          "Allows a proposal's execution to be canceled, even after approval, under certain rules defined in the Timelock contract.",
        items: [
          <SwitchCardDaoInfoItem
            switched={daoConstants.rules.cancelFunction}
            icon={<ExternalLinkIcon className="text-foreground" />}
            onClick={() =>
              window.open(
                `${daoConstants.cancelFunction}`,
                "_blank",
                "noopener,noreferrer",
              )
            }
            key={"switch"}
          />,
        ],
      },
    ],
  };

  return <BaseCardDaoInfo data={timelockData} />;
};
