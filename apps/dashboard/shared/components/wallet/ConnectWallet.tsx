/* eslint-disable @next/next/no-img-element */
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/shared/utils/";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Wallet } from "lucide-react";

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
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className={cn("btn-connect-wallet", className)}
                  >
                    <Wallet className="size-3.5" />
                    {label}
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} type="button">
                    Wrong network
                  </button>
                );
              }
              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="btn-connect-wallet flex items-center gap-2"
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
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
