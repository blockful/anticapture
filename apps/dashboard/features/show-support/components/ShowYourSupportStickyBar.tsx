"use client";

import { cn } from "@/shared/utils/";
import daoConfigByDaoId from "@/shared/dao-config";
import { useScreenSize } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";

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
  const message = `Is ${daoConfigByDaoId[daoId.toUpperCase() as DaoIdEnum].name} at risk? More data is needed for further research.`;
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
                "border-light-dark bg-surface-background text-primary flex flex-col gap-2 border-t py-3 pl-6 sm:flex-row",
                isDesktop ? "ml-[330px]" : "",
              )}
            >
              <span className="text-sm font-normal">{message}</span>
              <button
                onClick={openConnectModal}
                className="text-link hover:text-link/90 flex items-center font-mono text-sm font-medium uppercase tracking-[0.06em] transition-colors"
              >
                <span>{buttonText}</span>
                <ChevronRight
                  className="text-link ml-1 size-4"
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
