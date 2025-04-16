"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronRight } from "lucide-react";

interface ShowYourSupportStickyBarProps {
  message: string;
  buttonText: string;
  onClick?: () => void;
}

export const ShowYourSupportStickyBar = ({
  message,
  buttonText,
  onClick,
}: ShowYourSupportStickyBarProps) => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
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
        if (connected) {
          return null;
        }
        return (
          <div className="fixed bottom-0 left-0 right-0 z-10">
            <div className="flex w-full items-center border-t border-lightDark bg-darkest py-3 pl-6 text-white xl:ml-[330px]">
              <span className="text-sm font-normal">{message}</span>
              <button
                onClick={openConnectModal}
                className="font-roboto ml-4 flex items-center text-sm font-medium uppercase tracking-[0.06em] text-tangerine transition-colors hover:text-tangerine/90"
              >
                <span>{buttonText}</span> 
                <ChevronRight
                  className="ml-1 size-4 text-tangerine"
                  strokeWidth={2}
                />
              </button>
            </div>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
