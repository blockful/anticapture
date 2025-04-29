"use client";

import { cn } from "@/lib/client/utils";
import daoConfigByDaoId from "@/lib/dao-config";
import { useScreenSize } from "@/lib/hooks/useScreenSize";
import { DaoIdEnum } from "@/lib/types/daos";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import { SupportStageEnum } from "@/lib/enums/SupportStageEnum";

export const ShowYourSupportStickyBar = () => {
  const { isDesktop } = useScreenSize();
  const { daoId } = useParams() as { daoId: string };
  if (!daoId) {
    return null;
  }
  if (
    daoConfigByDaoId[daoId.toUpperCase() as DaoIdEnum]?.supportStage !==
    SupportStageEnum.ELECTION
  ) {
    return null;
  }
  const message = `Is ${daoConfigByDaoId[daoId.toUpperCase() as DaoIdEnum].name} at risk? More data needs more research.`;
  const buttonText = "SIGN TO SHOW YOUR SUPPORT";
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
          <div className="fixed bottom-0 left-0 right-4 z-10">
            <div
              className={cn(
                "flex flex-col gap-2 border-t border-lightDark bg-darkest py-3 pl-6 text-white sm:flex-row",
                isDesktop ? "ml-[330px]" : "",
              )}
            >
              <span className="text-sm font-normal">{message}</span>
              <button
                onClick={openConnectModal}
                className="font-roboto flex items-center text-sm font-medium uppercase tracking-[0.06em] text-tangerine transition-colors hover:text-tangerine/90"
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
