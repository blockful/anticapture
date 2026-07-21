"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertTriangle, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";

import { Button } from "@/shared/components";
import { SessionAccountButton } from "@/shared/components/auth/SessionAccountButton";
import { Tooltip } from "@/shared/components/design-system/tooltips";
import { useSession } from "@/shared/services/auth/client";
import { useLogin } from "@/shared/services/auth/LoginProvider";
import { cn } from "@/shared/utils";

const Jazzicon = dynamic(
  () => import("react-jazzicon").then((mod) => mod.default),
  {
    ssr: false,
  },
);

export const ConnectWallet = ({
  label = "Connect",
  className,
}: {
  label?: string;
  className?: string;
}) => {
  const { openLogin } = useLogin();
  const { data: session } = useSession();
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
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
                // A platform session without a wallet (magic link / Google):
                // show the account identity, not a connect prompt.
                if (session) {
                  return (
                    <SessionAccountButton
                      user={session.user}
                      className={className}
                    />
                  );
                }
                return (
                  <Button
                    onClick={() => openLogin()}
                    type="button"
                    variant="outline"
                    className={cn(className, "text-primary!")}
                    size="md"
                  >
                    <Wallet className="size-3.5" />
                    {label}
                  </Button>
                );
              }
              if (chain.unsupported) {
                return (
                  <Tooltip
                    tooltipContent="Wrong network"
                    asChild
                    triggerClassName="flex"
                  >
                    <Button
                      onClick={openChainModal}
                      type="button"
                      variant="destructive"
                      aria-label="Wrong network"
                      className={cn(className, "px-2.5")}
                    >
                      <AlertTriangle className="size-4" />
                    </Button>
                  </Tooltip>
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
