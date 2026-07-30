"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertTriangle, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";

import { Button } from "@/shared/components";
import { SessionAccountButton } from "@/shared/components/auth/SessionAccountButton";
import { Tooltip } from "@/shared/components/design-system/tooltips";
import { useAuthSession } from "@/shared/services/auth/useAuthSession";
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
  const { data: session } = useAuthSession();
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
                // Connecting is not signing in: this opens the wallet picker
                // and nothing else. The sign-in modal is raised by the
                // surfaces that actually need a session (drafts, API keys).
                return (
                  <Button
                    onClick={openConnectModal}
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
                        {/* The ENS avatar text record is owner-controlled and
                            can point at any host, so it can't be covered by the
                            next.config remotePatterns allowlist. */}
                        <Image
                          src={account.ensAvatar}
                          alt={account.displayName || "ENS Avatar"}
                          fill
                          className="object-cover"
                          unoptimized
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
