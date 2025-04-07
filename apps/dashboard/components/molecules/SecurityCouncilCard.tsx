"use client";

import { useMemo } from "react";
import {
  Badge,
  BaseCardDaoInfo,
  ButtonCardDaoInfoItem,
  CardData,
  ExternalLinkIcon,
  FocusIcon,
  GlassesIcon,
  NewspaperIcon,
  SwitchCardDaoInfoItem,
  TokensIcon,
} from "@/components/atoms";
import { useCountdown } from "@/hooks";
import { formatCountdown } from "@/lib/client/utils/time";
import { DaoInfoConfig } from "@/lib/dao-constants/types";

export const SecurityCouncilCard = ({
  targetTimestamp,
  securityCouncil,
}: {
  targetTimestamp: number;
  securityCouncil: DaoInfoConfig["securityCouncil"];
}) => {
  const countdown = useCountdown(targetTimestamp);
    
  const formattedCountdown = useMemo(
    () => formatCountdown(countdown),
    [countdown],
  );
  if (!securityCouncil) return null;
  const securityCouncilData: CardData = {
    title: "Security Council",
    icon: <NewspaperIcon />,
    sections: [
      {
        title: "Multisig",
        tooltip:
          "The security council is set up as a multisig with eight signers, needing the signature of 4 out of 8 to execute a cancel transaction for an approved proposal in the Timelock contract.",
        items: [
          <SwitchCardDaoInfoItem
            switched={securityCouncil.isActive}
            key="switch"
          />,
          <button
            className="flex h-full w-full"
            key="multisig"
            onClick={() =>
              window.open(
                `${securityCouncil.multisig.externalLink}`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <Badge className="flex h-full w-full gap-1 hover:border-lightDark hover:bg-transparent">
              <GlassesIcon />
              <p className="text-sm font-medium leading-tight">
                {securityCouncil.multisig.threshold} /{" "}
                {securityCouncil.multisig.signers}
              </p>
              <ExternalLinkIcon className="text-tangerine" />
            </Badge>
          </button>,
        ],
      },
      {
        title: "Expiration",
        tooltip: `The security council is implemented with an expiration date. Once expired, any address can call a function to remove the privileged access that the council has to the timelock's "cancel()" function, preventing it to perpetuating a veto hold over the DAO.`,
        items: [
          <ButtonCardDaoInfoItem
            key="Expiration"
            label={securityCouncil.expiration.date}
            icon={<FocusIcon className="text-tangerine" />}
            disabled
          />,
          <ButtonCardDaoInfoItem
            key="Expiration Countdown"
            label={formattedCountdown}
            disabled
            icon={<TokensIcon className="text-tangerine" />}
            className={`${countdown.isLoading ? "flex animate-pulse justify-center space-x-2" : ""}`}
          />,
        ],
      },
    ],
  };

  return <BaseCardDaoInfo data={securityCouncilData} />;
};
