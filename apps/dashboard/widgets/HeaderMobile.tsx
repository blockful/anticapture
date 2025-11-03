"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ButtonHeaderSidebar, ConnectWallet } from "@/shared/components";
import { cn } from "@/shared/utils/";
import { X, Menu, BarChart4, BookOpen, Heart, HelpCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { AnticaptureIcon, TelegramIcon } from "@/shared/components/icons";
import { ANTICAPTURE_TELEGRAM_BOT } from "@/shared/constants/social-media";

export const HeaderMobile = ({
  overlayClassName,
}: {
  overlayClassName?: string;
}) => {
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const pathname = usePathname();

  const menuItems = useMemo(
    () => [
      {
        page: "/",
        label: "Panel",
        icon: BarChart4,
        isGlobal: true,
        onClick: () => {
          setIsMenuOpen(false);
        },
      },
      {
        page: "",
        label: "Alerts",
        icon: TelegramIcon,
        isAction: true,
        onClick: () => {
          window.open(
            ANTICAPTURE_TELEGRAM_BOT,
            "_blank",
            "noopener,noreferrer",
          );
        },
      },
    ],
    [],
  );

  const staticPages = [
    {
      page: "donate",
      label: "Donate",
      icon: Heart,
      isGlobal: true,
    },
    {
      page: "glossary",
      label: "Glossary",
      icon: BookOpen,
      isGlobal: true,
    },
    {
      page: "faq",
      label: "FAQ",
      icon: HelpCircle,
      isGlobal: true,
    },
  ];

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
    <>
      {/* Header */}
      <div className="border-light-dark bg-surface-background absolute left-0 right-0 top-0 z-50 border-b px-4 py-1.5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex cursor-pointer">
            <AnticaptureIcon className="size-11" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-full w-full">
              <ConnectWallet className="rounded-md! px-2! py-1! text-sm! font-medium!" />
            </div>
            <button className="p-1.5" onClick={onToggleMenu}>
              {isMenuOpen ? (
                <X className="size-6 text-zinc-50" />
              ) : (
                <Menu className="size-6 text-zinc-50" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Overlay */}
      <div
        className={cn(
          "bg-surface-background sticky top-0 z-30 w-full transition-all duration-300",
        )}
      >
        <div
          className={cn(
            `fixed left-0 right-0 z-50 flex h-[calc(100vh-57px)] w-screen bg-black/90 transition-all duration-300`,
            pathname === "/" ? "top-[57px]" : "top-[98px]",
            isMenuOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
            overlayClassName,
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
            {menuItems.map((item, id) => (
              <ButtonHeaderSidebar
                key={id}
                page={item.page || ""}
                icon={item.icon}
                label={item.label}
                isGlobal={item.isGlobal}
                isAction={item.isAction}
                onClick={item.onClick}
              />
            ))}

            <div className="border-light-dark w-full border-t" />

            {staticPages.map((item) => (
              <ButtonHeaderSidebar
                key={item.page}
                page={item.page || ""}
                icon={item.icon}
                label={item.label}
                isGlobal={item.isGlobal}
                onClick={() => {
                  setIsMenuOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
