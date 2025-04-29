"use client";

import { useState, useEffect, useMemo } from "react";
import { ButtonHeaderSidebar, TelegramIcon } from "@/components/atoms";
import { HeaderNavMobile } from "@/components/molecules";
import { cn } from "@/lib/client/utils";
import { BarChart4 } from "lucide-react";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { useParams, useRouter } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import daoConfigByDaoId from "@/lib/dao-config";
import { DaoSelectorMobile } from "@/components/molecules";

export const StickyPageHeader = () => {
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const headerHeight = 87;

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

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId?.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];

  return (
    <>
      <header
        className={cn(
          "fixed left-0 right-0 top-0 z-30 w-full bg-darkest shadow-md transition-transform duration-300",
        )}
      >
        <DaoSelectorMobile daoIdEnum={daoIdEnum} />
        <HeaderNavMobile />
      </header>

      <div
        className={cn(
          "sticky top-0 z-30 w-full bg-darkest transition-all duration-300",
        )}
      >
        <div
          className={cn(
            `fixed left-0 right-0 top-[${headerHeight}px] z-30 flex h-[calc(100vh-57px)] w-screen bg-black/90 transition-all duration-300`,
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
      </div>
    </>
  );
};
