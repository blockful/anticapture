"use client";

import { useState } from "react";
import { UniswapIcon } from "@/components/01-atoms";
import { ConnectWallet } from "./connect-wallet";
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
        className="z-50 fixed top-6 left-6 border border-middleDark hover:bg-dark group transition rounded-full bg-darkest text-xs p-2 xl:hidden"
      >
        {displaySidebar ? (
          <ChevronLeft className="w-4 h-4 group-hover:text-foreground text-middleDark" />
        ) : (
          <ChevronRight className="w-4 h-4 group-hover:text-foreground text-middleDark" />
        )}
      </button>
      <header
        style={{
          transform: displaySidebar ? "translateX(0px)" : "translateX(-354px)",
        }}
        className="z-40 absolute transition xl:absolute top-0 left-0 xl:transform xl:!translate-x-0 bg-dark border-l-none border-t-none border-b-none border border-middleDark w-[330px] h-screen shadow-lg flex flex-col space-x-6 space-y-12 items-start justify-start p-6"
      >
        <div className="flex space-x-2 items-center">
          <div className="p-1.5 bg-lightDark border-middleDark border rounded-[6px]">
            <UniswapIcon />
          </div>
          <h1 className="font-semibold text-sm text-white">Uniswap GovRisk</h1>
        </div>
        <ConnectWallet />
      </header>
    </>
  );
};
