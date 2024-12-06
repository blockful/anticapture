"use client";

import { useState } from "react";
import { UniswapIcon } from "@/components/01-atoms";
import { ConnectWallet } from "@/components/ui/connect-wallet";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toggleScreenScroll } from "@/lib/client/utils";

export const HeaderSidebar = () => {
  /**
   * Below logic is only used for screens that are smaller than 1200px wide
   */
  const [displaySidebar, setDisplaySidebar] = useState(false);
  const toggleSidebar = () => {
    toggleScreenScroll();
    setDisplaySidebar(!displaySidebar);
  };

  return (
    <>
      <button
        onClick={toggleSidebar}
        style={{
          transform: displaySidebar ? "translateX(284px)" : "",
        }}
        className="group fixed left-6 top-6 z-50 rounded-full border border-middleDark bg-darkest p-2 text-xs transition hover:bg-dark xl:hidden"
      >
        {displaySidebar ? (
          <ChevronLeft className="h-4 w-4 text-middleDark group-hover:text-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-middleDark group-hover:text-foreground" />
        )}
      </button>
      <header
        style={{
          transform: displaySidebar ? "translateX(0px)" : "translateX(-354px)",
        }}
        className="border-l-none border-t-none border-b-none absolute left-0 top-0 z-40 flex h-screen w-[330px] flex-col items-start justify-start space-x-6 space-y-12 border border-middleDark bg-dark p-6 shadow-lg transition xl:absolute xl:!translate-x-0 xl:transform"
      >
        <div className="flex items-center space-x-2">
          <div className="rounded-[6px] border border-middleDark bg-lightDark p-1.5">
            <UniswapIcon className="h-5 w-5 text-[#FC72FF]" />
          </div>
          <h1 className="text-sm font-semibold text-white">Uniswap GovRisk</h1>
        </div>
        <ConnectWallet />
      </header>
    </>
  );
};
