"use client";

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
import { useCountdown } from "@/hooks/useCountdown";
import { DaoConstants } from "@/lib/dao-constants/types";
import { formatCountdown } from "@/lib/client/utils/time";
import { useMemo } from "react";

export const SecurityCouncilCard = ({
  daoConstants,
}: {
  daoConstants: DaoConstants;
}) => {
  const { securityCouncil } = daoConstants;
  const targetTimestamp = securityCouncil?.expiration.timestamp;
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
          "On-chain governance relies on smart contracts that only execute transactions approved by on-chain votes.",
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
                `${daoConstants.securityCouncil?.multisig.externalLink}`,
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
              <ExternalLinkIcon className="text-[#EC762E]" />
            </Badge>
          </button>,
        ],
      },
      {
        title: "Expiration",
        tooltip:
          "Off-chain governance—often done through Snapshot—allows token holders to vote without on-chain transactions.",
        items: [
          <ButtonCardDaoInfoItem
            key="Expiration"
            label={securityCouncil.expiration.date}
            icon={<FocusIcon className="text-[#EC762E]" />}
          />,
          <ButtonCardDaoInfoItem
            key="Expiration Countdown"
            label={formattedCountdown}
            icon={<TokensIcon className="text-[#EC762E]" />}
          />,
        ],
      },
    ],
  };

  return <BaseCardDaoInfo data={securityCouncilData} />;
};
