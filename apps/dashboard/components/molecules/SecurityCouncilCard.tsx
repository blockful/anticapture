"use client";

import { useMemo } from "react";
import {
  Badge,
  ButtonCardDaoInfoItem,
  CardData,
  CountdownDaoInfo,
  ExternalLinkIcon,
  FocusIcon,
  GlassesIcon,
  NewspaperIcon,
  SwitchCardDaoInfoItem,
  TokensIcon,
  TooltipInfo,
} from "@/components/atoms";
import { useCountdown } from "@/hooks";
import { DaoConstantsFullySupported } from "@/lib/dao-constants/types";
import { formatCountdown } from "@/lib/client/utils/time";
import { CheckCheck, Key, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/client/utils";

export const SecurityCouncilCard = ({
  daoConstants,
}: {
  daoConstants: DaoConstantsFullySupported;
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

  return (
    <div className="flex h-full w-full gap-6 py-2 sm:gap-5 sm:p-4">
      <div className="flex w-full justify-between gap-5">
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <div className="flex gap-1.5 rounded-md py-2 sm:gap-0 sm:bg-lightDark sm:p-2">
            <ShieldCheck className="size-4 text-foreground sm:size-6" />
            <h3 className="text-xs font-semibold uppercase text-[#FAFAFA] sm:hidden">
              Security Council
            </h3>
          </div>
          <div className="flex flex-col gap-3 sm:gap-1.5">
            <h3 className="hidden text-xs font-semibold uppercase text-[#FAFAFA] sm:block">
              Security Council
            </h3>
            <div className="flex w-full items-center justify-between gap-1.5 sm:justify-start">
              <p className="text-sm font-medium text-foreground">Multisig:</p>
              <div className="flex items-center gap-1.5 rounded-lg bg-dark px-2 py-1 sm:rounded-none sm:bg-none sm:p-0">
                <div
                  className={cn(
                    "flex items-center gap-1.5",
                    securityCouncil.isActive
                      ? "text-green-400"
                      : "text-red-400",
                  )}
                >
                  <CheckCheck className="size-3.5" />
                  <p className="text-sm font-medium">
                    {securityCouncil.isActive ? "Yes" : "No"}
                  </p>
                </div>
                <div className="size-1 items-center rounded-full bg-[#3F3F46] sm:flex" />
                <Key className="size-3.5 text-tangerine" />
                <p className="text-sm font-medium text-[#FAFAFA]">
                  {securityCouncil.multisig.threshold}/
                  {securityCouncil.multisig.signers}
                  <span className="hidden text-foreground sm:inline">
                    {" "}
                    required for transactions
                  </span>
                  <span className="inline text-foreground sm:hidden">
                    {" "}
                    required
                  </span>
                </p>
                <div className="hidden sm:flex">
                  <TooltipInfo text="The security council is set up as a multisig with eight signers, needing the signature of 4 out of 8 to execute a cancel transaction for an approved proposal in the Timelock contract." />
                </div>
              </div>
            </div>
            <div className="flex w-full items-center justify-between sm:hidden">
              <p className="text-sm font-medium text-foreground">Countdown:</p>
              <CountdownDaoInfo
                daoConstants={daoConstants}
                className="border-none bg-dark"
              />
            </div>
          </div>
        </div>
        <div className="hidden sm:flex">
          <CountdownDaoInfo daoConstants={daoConstants} />
        </div>
      </div>
    </div>
  );
};
