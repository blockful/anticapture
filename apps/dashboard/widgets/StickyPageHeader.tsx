"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ButtonHeaderSidebar,
  HeaderDAOSidebarDropdown,
} from "@/shared/components";
import { cn } from "@/shared/utils/";
import { BarChart4 } from "lucide-react";
import { useRouter } from "next/navigation";
import { HeaderNavMobile } from "@/widgets";
import { TelegramIcon } from "@/shared/components/icons";
import { ANTICAPTURE_TELEGRAM_BOT } from "@/shared/constants/social-media";
export const StickyPageHeader = () => {
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const router = useRouter();

  const menuItems = useMemo(
    () => [
      {
        page: "panel",
        label: "Panel",
        icon: BarChart4,
        onClick: () => {
          router.push("/");
          setIsMenuOpen(false);
        },
      },
      {
        page: "alerts",
        label: "Get Security Alerts",
        icon: TelegramIcon,
        onClick: () => {
          window.open(
            ANTICAPTURE_TELEGRAM_BOT,
            "_blank",
            "noopener,noreferrer",
          );
        },
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

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="h-[98px]">
      <header
        className={cn(
          "bg-surface-background fixed left-0 right-0 top-0 z-30 w-full shadow-md transition-transform duration-300",
        )}
      >
        <HeaderDAOSidebarDropdown />

        <HeaderNavMobile />
      </header>

      <div
        className={cn(
          "bg-surface-background sticky top-0 z-30 w-full transition-all duration-300",
        )}
      >
        <div
          className={cn(
            `fixed left-0 right-0 top-[87px] z-30 flex h-[calc(100vh-57px)] w-screen bg-black/90 transition-all duration-300`,
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
                key={item.page}
                page={item.page || ""}
                icon={item.icon}
                label={item.label}
                onClick={item.onClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
