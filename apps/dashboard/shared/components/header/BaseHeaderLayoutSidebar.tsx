"use client";

import { ReactNode, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toggleScreenScroll } from "@/shared/utils";
import { useScreenSize } from "@/shared/hooks";

export const BaseHeaderLayoutSidebar = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [displaySidebar, setDisplaySidebar] = useState<boolean>(false);
  const { isTablet, isDesktop } = useScreenSize();

  const toggleSidebar = () => {
    toggleScreenScroll();
    setDisplaySidebar(!displaySidebar);
  };

  return (
    <div className="relative flex h-screen overflow-hidden">
      {isTablet && !isDesktop && (
        <button
          onClick={toggleSidebar}
          className={`border-light-dark bg-darkest hover:bg-dark z-100 group fixed left-6 top-6 rounded-full border p-2 text-xs transition xl:hidden ${
            displaySidebar ? "translate-x-[284px]" : ""
          }`}
        >
          {displaySidebar ? (
            <ChevronLeft className="text-middle-dark group-hover:text-foreground size-4" />
          ) : (
            <ChevronRight className="text-middle-dark group-hover:text-foreground size-4" />
          )}
        </button>
      )}
      <div
        className={`${
          isTablet && !isDesktop
            ? `z-90 fixed left-0 top-0 h-screen transition-transform xl:absolute xl:translate-x-0 ${
                displaySidebar ? "translate-x-0" : "-translate-x-[354px]"
              }`
            : "relative"
        }`}
      >
        {children}
      </div>
    </div>
  );
};
