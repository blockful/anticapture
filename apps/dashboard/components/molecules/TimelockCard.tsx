"use client";

import {
  BaseCardDaoInfo,
  ButtonCardDaoInfoItem,
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
    icon: <LockIcon />,
    sections: [
      {
        title: "Timelock",
        tooltip:
          "A Timelock contract holds the DAO's assets. The Governor contract can execute approved proposals against these assets after a specified waiting period.",
        items: [
          <SwitchCardDaoInfoItem
            switched={daoConstants.rules.timelock}
            key={"switch"}
          />,
          <ButtonCardDaoInfoItem
            key={"button-card"}
            label="View"
            icon={<ExternalLinkIcon className="text-tangerine" />}
            onClick={() =>
              openEtherscanAddress(daoConstants.contracts.timelock)
            }
            inverted={true}
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
            key={"switch"}
          />,
          daoConstants.rules.cancelFunction && (
            <ButtonCardDaoInfoItem
              key={"button-card"}
              label="View"
              icon={<ExternalLinkIcon className="text-tangerine" />}
              inverted={true}
              onClick={() =>
                window.open(
                  `${daoConstants.cancelFunction}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            />
          ),
        ],
      },
    ],
  };

  return <BaseCardDaoInfo data={timelockData} />;
};
