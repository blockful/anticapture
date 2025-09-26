"use client";

import { ReactNode, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toggleScreenScroll } from "@/shared/utils";
import { useScreenSize } from "@/shared/hooks";
import { IconButton } from "@/shared/components";

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
        <IconButton
          onClick={toggleSidebar}
          className={`border-light-dark z-100 group fixed left-6 top-6 rounded-full border transition xl:hidden ${
            displaySidebar ? "translate-x-[284px]" : ""
          }`}
          iconClassName="text-middle-dark group-hover:text-secondary size-4"
          icon={displaySidebar ? ChevronLeft : ChevronRight}
        />
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
