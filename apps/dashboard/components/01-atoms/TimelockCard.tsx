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
        tooltip: "Direct liquid profit: Cost of direct capture",
        items: [
          {
            type: "switch",
            label: "Enabled",
            switched: daoConstants.rules.timelock,
          },
          {
            type: "button",
            label: "View",
            icon: <ExternalLinkIcon />, //TODO: Add isIcon Right or left
            onClick: () =>
              openEtherscanAddress(daoConstants.contracts.timelock),
          },
        ],
      },
      {
        title: "Cancel Function",
        tooltip: "Direct liquid profit: Cost of direct capture",
        items: [
          {
            type: "switch",
            label: "Enabled",
            switched: daoConstants.rules.cancelFunction,
          },
        ],
      },
    ],
  };

  return <BaseCardDao data={timelockData} />;
};
