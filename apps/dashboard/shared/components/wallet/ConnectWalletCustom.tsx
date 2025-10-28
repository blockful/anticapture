"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Wallet } from "lucide-react";
import { Button } from "@/shared/components";
import { cn } from "@/shared/utils";

const Jazzicon = dynamic(
  () => import("react-jazzicon").then((mod) => mod.default),
  {
    ssr: false,
  },
);

export const ConnectWalletCustom = ({
  label = "Connect to vote",
  className,
}: {
  label?: string;
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
            className="flex h-full w-full"
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    type="button"
                    variant="primary"
                    className={cn(className)}
                    size="md"
                  >
                    <Wallet className="size-3.5" />
                    {label}
                  </Button>
                );
              }
              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} type="button">
                    Wrong network
                  </Button>
                );
              }
              return (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={openAccountModal}
                    type="button"
                    className="btn-connect-wallet"
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
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
