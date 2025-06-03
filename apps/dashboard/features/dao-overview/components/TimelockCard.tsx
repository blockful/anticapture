"use client";

import {
  BaseCardDaoInfo,
  CardData,
  SwitchCardDaoInfoItem,
} from "@/shared/components";
import { DaoOverviewConfig } from "@/shared/dao-config/types";
import { openEtherscanAddress } from "@/shared/utils/openEtherscanAddress";
import { Clock4, ExternalLink } from "lucide-react";
import { Address } from "viem";

export const TimelockCard = ({
  daoOverview,
}: {
  daoOverview: DaoOverviewConfig;
}) => {
  const timelockData: CardData = {
    title: "Timelock",
    icon: <Clock4 className="text-foreground size-4" />,
    sections: [
      {
        title: "Timelock",
        tooltip:
          "A Timelock contract holds the DAO's assets. The Governor contract can execute approved proposals against these assets after a specified waiting period.",
        items: [
          <SwitchCardDaoInfoItem
            switched={daoOverview?.rules?.timelock}
            icon={<ExternalLink className="text-foreground size-3.5" />}
            onClick={() =>
              openEtherscanAddress(daoOverview?.contracts?.timelock as Address)
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
            switched={daoOverview?.rules?.cancelFunction}
            icon={<ExternalLink className="text-foreground size-3.5" />}
            onClick={() =>
              window.open(
                `${daoOverview.cancelFunction}`,
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
