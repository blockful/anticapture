"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SUPPORTED_DAO_NAMES, DaoIdEnum } from "@/lib/types/daos";
import { AnticaptureIcon, ConnectWallet } from "@/components/atoms";
import { HeaderNavMobile } from "@/components/molecules";
import { cn } from "@/lib/client/utils";

export const HeaderMobile = () => {
  const pathname = usePathname();
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [showHeader, setShowHeader] = useState<boolean>(true);

  const isDefault = pathname === "/";
  const daoId = isDefault ? null : pathname.split("/")[1]?.toUpperCase();
  const isValidDao = daoId && SUPPORTED_DAO_NAMES.includes(daoId as DaoIdEnum);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 0) {
        setShowHeader(true);
      } else if (currentScrollY < lastScrollY) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <header
        className={cn(
          "fixed left-0 right-0 top-0 z-40 w-full bg-darkest shadow-md transition-transform duration-300",
          showHeader ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="px-4 py-3">
          <div className="flex justify-between">
            <Link href={"/"} className="flex cursor-pointer">
              <AnticaptureIcon />
            </Link>
            <div className="flex">
              <ConnectWallet />
            </div>
          </div>
        </div>
      </header>

      {isValidDao && (
        <div
          className={cn(
            "sticky top-0 z-30 w-full bg-darkest transition-all duration-300",
            showHeader && "top-[57px]",
          )}
        >
          <HeaderNavMobile />
        </div>
      )}
    </>
  );
};
