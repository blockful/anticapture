"use client";

import {
  Badge,
  BaseCardDaoInfo,
  CardData,
  SwitchCardDaoInfoItem,
} from "@/shared/components";
import { DaoOverviewConfig } from "@/shared/dao-config/types";
import { Clock, Clock4, ExternalLink } from "lucide-react";

// timelock card section
export const TimelockCard = ({
  daoOverview,
}: {
  daoOverview: DaoOverviewConfig;
}) => {
  const timelockData: CardData = {
    title: "Timelock",
    icon: <Clock4 className="text-secondary size-4" />,
    sections: [
      {
        title: "Timelock",
        tooltip:
          "A Timelock contract holds the DAO's assets. The Governor contract can execute approved proposals against these assets after a specified waiting period.",
        items: daoOverview.rules?.timelock
          ? [
              <SwitchCardDaoInfoItem
                switched={daoOverview.rules?.timelock}
                icon={<ExternalLink className="text-secondary size-3.5" />}
                href={`${daoOverview.chain.blockExplorers?.default.url}/address/${daoOverview.contracts?.timelock}`}
                key={"switch"}
              />,
            ]
          : [
              <Badge className="text-secondary" key={"hello2"}>
                <Clock className="text-secondary size-3.5" />
                Research pending
              </Badge>,
            ],
      },
      {
        title: "Cancel Function",
        tooltip:
          "Allows a proposal's execution to be canceled, even after approval, under certain rules defined in the Timelock contract.",
        items:
          daoOverview.rules?.cancelFunction !== undefined
            ? [
                <SwitchCardDaoInfoItem
                  switched={daoOverview.rules?.cancelFunction}
                  icon={
                    daoOverview.cancelFunction ? (
                      <ExternalLink className="text-secondary size-3.5" />
                    ) : undefined
                  }
                  href={daoOverview.cancelFunction}
                  key={"switch"}
                />,
              ]
            : [
                <Badge className="text-secondary" key={"hello2"}>
                  <Clock className="text-secondary size-3.5" />
                  Research pending
                </Badge>,
              ],
      },
    ],
  };

  return <BaseCardDaoInfo data={timelockData} />;
};
