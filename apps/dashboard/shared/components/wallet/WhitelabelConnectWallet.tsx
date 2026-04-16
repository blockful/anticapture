"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";

import { Button } from "@/shared/components";
import { VotingPowerBadge } from "@/shared/components/wallet/VotingPowerBadge";
import { cn } from "@/shared/utils";

const Jazzicon = dynamic(
  () => import("react-jazzicon").then((mod) => mod.default),
  {
    ssr: false,
  },
);

export const WhitelabelConnectWallet = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
            className="flex items-center"
          >
            {!connected ? (
              <Button
                onClick={openConnectModal}
                type="button"
                variant="outline"
                size="md"
                className={cn("whitespace-nowrap", className)}
              >
                <Wallet className="size-3.5" />
                Connect wallet
              </Button>
            ) : chain.unsupported ? (
              <Button onClick={openChainModal} type="button" variant="outline">
                Wrong network
              </Button>
            ) : (
              <Button
                onClick={openAccountModal}
                type="button"
                variant="outline"
                className={cn("max-w-full gap-2 px-3 py-2", className)}
              >
                {account.ensAvatar ? (
                  <div className="relative size-6 overflow-hidden rounded-full">
                    <Image
                      src={account.ensAvatar}
                      alt={account.displayName || "ENS Avatar"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative size-6 overflow-hidden rounded-full">
                    {account.address && (
                      <Jazzicon
                        diameter={24}
                        seed={parseInt(account.address.slice(2, 10), 16)}
                      />
                    )}
                  </div>
                )}
                <span className="text-primary max-w-[140px] truncate text-sm font-medium">
                  {account.displayName}
                </span>
                <span className="text-dimmed">·</span>
                <VotingPowerBadge />
              </Button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
