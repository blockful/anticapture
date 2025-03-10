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

export const SecurityCouncilCard = ({
  daoConstants,
}: {
  daoConstants: DaoConstants;
}) => {
  const targetTimestamp =
    daoConstants.securityCouncil?.expiration.timestamp ?? 0;

  const countdown = useCountdown(targetTimestamp);
  if (!daoConstants.securityCouncil) return null;

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
            switched={daoConstants.securityCouncil?.isActive}
            key={"switch"}
          />,
          <button className="flex h-full w-full" key={"multisig"}>
            <Badge className="flex h-full w-full gap-1 hover:border-lightDark hover:bg-transparent">
              <GlassesIcon />
              <p className="text-sm font-medium leading-tight">
                {daoConstants.securityCouncil?.multisig.signers} /{" "}
                {daoConstants.securityCouncil?.multisig.threshold}
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
            label={daoConstants.securityCouncil?.expiration.date}
            icon={<FocusIcon className="text-[#EC762E]" />}
          />,
          <ButtonCardDaoInfoItem
            key="Expiration Countdown"
            label={
              countdown.expired
                ? "Expired"
                : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`
            }
            icon={<TokensIcon className="text-[#EC762E]" />}
          />,
        ],
      },
    ],
  };

  return <BaseCardDaoInfo data={securityCouncilData} />;
};
