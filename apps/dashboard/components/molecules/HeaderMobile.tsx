"use client";

import { usePathname } from "next/navigation";
import { useScrollHeader } from "@/hooks";
import { AnticaptureIcon, ConnectWallet } from "@/components/atoms";
import { SUPPORTED_DAO_NAMES, DaoIdEnum } from "@/lib/types/daos";
import { HeaderNavMobile } from "@/components/molecules";
import { cn } from "@/lib/client/utils";

export const HeaderMobile = () => {
  const pathname = usePathname();

  const isDefault = pathname === "/";
  const daoId = isDefault ? null : pathname.split("/")[1]?.toUpperCase();
  const isValidDao = daoId && SUPPORTED_DAO_NAMES.includes(daoId as DaoIdEnum);

  const { headerRef, observerRef, isVisible, isAtTop, headerHeight } =
    useScrollHeader();

  return (
    <>
      <div
        ref={observerRef}
        className="pointer-events-none absolute top-0 h-2 w-full"
      />

      {!isAtTop && <div style={{ height: headerHeight }} />}

      <header
        ref={headerRef}
        className={cn(
          "left-0 right-0 top-0 z-40 w-full bg-darkest transition-all duration-300",
          isAtTop ? "relative" : "fixed",
          !isAtTop && !isVisible ? "-translate-y-full" : "translate-y-0",
          !isAtTop && "shadow-md",
        )}
      >
        <div className="px-4 py-3">
          <div className="flex justify-between">
            <div className="flex">
              <AnticaptureIcon />
            </div>
            <div className="flex">
              <ConnectWallet />
            </div>
          </div>
        </div>
      </header>
      {isValidDao && (
        <div className="transition-all duration-700">
          <HeaderNavMobile />
        </div>
      )}
    </>
  );
};
