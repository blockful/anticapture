"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toggleScreenScroll } from "@/lib/client/utils";
import { useScreenSize } from "@/lib/hooks/useScreenSize";
import { ConnectWallet } from "@/components/atoms";
import { HeaderMobile } from "@/components/molecules";

export const BaseHeaderLayoutSidebar = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  /**
   * Below logic is only used for screens that are smaller than 1200px wide
   */
  const [displaySidebar, setDisplaySidebar] = useState<boolean>(false);
  const { isMobile, isTablet } = useScreenSize();
  const toggleSidebar = () => {
    toggleScreenScroll();
    setDisplaySidebar(!displaySidebar);
  };

  return isMobile && !isTablet ? (
    <HeaderMobile />
  ) : (
    <>
      <button
        onClick={toggleSidebar}
        className={`group fixed left-6 top-6 z-50 rounded-full border border-middleDark bg-darkest p-2 text-xs transition hover:bg-dark xl:hidden ${displaySidebar && "translate-x-[284px]"}`}
      >
        {displaySidebar ? (
          <ChevronLeft className="h-4 w-4 text-middleDark group-hover:text-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-middleDark group-hover:text-foreground" />
        )}
      </button>
      <header
        className={`fixed left-0 top-0 z-40 flex h-screen w-[330px] flex-col items-start justify-start border border-middleDark bg-dark shadow-lg transition-transform xl:absolute xl:translate-x-0 ${displaySidebar ? "translate-x-0" : "-translate-x-[354px]"}`}
      >
        <div className="flex h-full w-full flex-col justify-between">
          <div>{children}</div>
          <div className="flex w-full px-4 py-5">
            <ConnectWallet />
          </div>
        </div>
      </header>
    </>
  );
};
