"use client";

import { LockIcon, ExternalLinkIcon } from "@/components/01-atoms";
import { DaoConstants } from "@/lib/dao-constants/types";
import { openEtherscanAddress } from "@/lib/utils/openEtherscanAddress";
import { BaseCardDao, CardData } from "./BaseCardDao";

export const TimelockCard = ({
  daoConstants,
}: {
  daoConstants: DaoConstants;
}) => {
  const timelockData: CardData = {
    title: "Timelock",
    icon: <LockIcon />,
    sections: [
      {
        title: "Timelock",
        tooltip:
          "A Timelock contract holds the DAO’s assets. The Governor contract can execute approved proposals against these assets after a specified waiting period.",
        items: [
          {
            type: "switch",
            label: "Enabled",
            switched: daoConstants.rules.timelock,
          },
          {
            type: "button",
            label: "View",
            icon: <ExternalLinkIcon className="text-[#EC762E]" />,
            onClick: () =>
              window.open(
                `${daoConstants.snapshot}`,
                "_blank",
                "noopener,noreferrer",
              ),
            inverted: true,
          },
        ],
      },
      {
        title: "Cancel Function",
        tooltip:
          "Allows a proposal’s execution to be canceled, even after approval, under certain rules defined in the Timelock contract.",
        items: [
          {
            type: "switch",
            label: "Enabled",
            switched: daoConstants.rules.cancelFunction,
          },
          {
            type: "button",
            label: "View",
            icon: <ExternalLinkIcon className="text-[#EC762E]" />,
            onClick: () => openEtherscanAddress(daoConstants.contracts.token),
            inverted: true,
          },
        ],
      },
    ],
  };

  return <BaseCardDao data={timelockData} />;
};
