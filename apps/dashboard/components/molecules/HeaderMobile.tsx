"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AnticaptureIcon,
  ButtonHeaderSidebar,
  ConnectWallet,
  TelegramIcon,
} from "@/components/atoms";
import { HeaderNavMobile } from "@/components/molecules";
import { cn } from "@/lib/client/utils";
import { X, Menu, BarChart4 } from "lucide-react";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { useRouter } from "next/navigation";

export const HeaderMobile = () => {
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const headerHeight = 57;

  const router = useRouter();

  const menuItems = useMemo(
    () => [
      {
        anchorId: SECTIONS_CONSTANTS.panel.anchorId,
        label: "Panel",
        icon: BarChart4,
        onClick: () => {
          sessionStorage.setItem("scrollToSection", "panel");
          router.push("/");
          setIsMenuOpen(false);
        },
      },
      {
        label: "Get Security Alerts",
        icon: TelegramIcon,
      },
    ],
    [router],
  );

  function useLockBodyScroll(isLocked: boolean) {
    useEffect(() => {
      if (isLocked) {
        document.body.classList.add("overflow-hidden");
      } else {
        document.body.classList.remove("overflow-hidden");
      }

      return () => {
        document.body.classList.remove("overflow-hidden");
      };
    }, [isLocked]);
  }
  useLockBodyScroll(isMenuOpen);

  const onToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
          <div className="flex items-center justify-between">
            <Link href="/" className="flex cursor-pointer">
              <AnticaptureIcon />
            </Link>
            <div className="flex items-center gap-3">
              <ConnectWallet className="!px-3 !py-1.5" />
              <button className="p-2" onClick={onToggleMenu}>
                {isMenuOpen ? (
                  <X className="size-6 text-zinc-50" />
                ) : (
                  <Menu className="size-6 text-zinc-50" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div style={{ height: headerHeight }} />
      <div
        className={cn(
          "sticky top-0 z-30 w-full bg-darkest transition-all duration-300",
          showHeader && "top-[57px]",
        )}
      >
        <HeaderNavMobile />
      </div>

      <div
        className={cn(
          `fixed left-0 right-0 top-[${headerHeight}px] z-50 flex h-[calc(100vh-57px)] w-screen bg-black/90 transition-all duration-300`,
          isMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={onToggleMenu}
      >
        <div
          className={cn(
            "flex h-full w-full flex-col gap-3 bg-black p-3 shadow-lg transition-transform duration-300 ease-in-out",
            isMenuOpen ? "translate-x-0" : "translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {menuItems.map((item) => (
            <ButtonHeaderSidebar
              key={item.anchorId}
              anchorId={item.anchorId || ""}
              icon={item.icon}
              label={item.label}
              onClick={item.onClick}
            />
          ))}
        </div>
      </div>
    </>
  );
};
