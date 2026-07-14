"use client";

import { BarChart4, Bell, Code } from "lucide-react";
import Link from "next/link";
import { useMemo, type ElementType } from "react";

import {
  ButtonMainNav,
  ConnectWallet,
  BottomNavigationButtons,
} from "@/shared/components";
import { AnticaptureIcon } from "@/shared/components/icons";
import { useGatedNavClick } from "@/shared/services/auth/useGatedNav";

type HeaderItem = {
  page: string;
  label: string;
  icon: ElementType;
  isGlobal: boolean;
  /** Login-gated page: signed-out clicks open the sign-in modal instead. */
  requiresAuth?: boolean;
};

export const HeaderSidebar = () => {
  const gatedNavClick = useGatedNavClick();

  const headerItems = useMemo<HeaderItem[]>(
    () => [
      {
        page: "/",
        label: "Panel",
        icon: BarChart4,
        isGlobal: true,
      },
      {
        page: "alerts",
        label: "Alerts",
        icon: Bell,
        isGlobal: true,
      },
      {
        page: "api-keys",
        label: "API",
        icon: Code,
        isGlobal: true,
        requiresAuth: true,
      },
    ],
    [],
  );

  return (
    <header
      className={`border-light-dark bg-surface-background z-50 hidden h-screen w-[68px] border-r lg:block`}
    >
      <div className="flex h-full w-full flex-col items-start">
        <Link
          prefetch={true}
          href="/"
          className="border-b-light-dark h-16.25 flex w-full shrink-0 items-center justify-center border-b"
        >
          <AnticaptureIcon className="size-9" />
        </Link>
        <div className="flex h-full w-full flex-col items-center justify-between">
          <div className="flex h-full flex-col gap-1.5 p-1.5">
            {headerItems.map((item) => (
              <ButtonMainNav
                key={item.page || item.label}
                page={item.page || ""}
                icon={item.icon}
                label={item.label}
                isGlobal={item.isGlobal}
                onClick={
                  item.requiresAuth
                    ? (e) => void gatedNavClick(e, item.page)
                    : undefined
                }
              />
            ))}
          </div>

          <div className="flex w-full flex-col">
            <div className="border-middle-dark mx-1.5 flex flex-col gap-2 border-b border-t py-2">
              <BottomNavigationButtons />
            </div>
            <div className="mx-auto flex flex-col px-2 py-4">
              <ConnectWallet label="" className="px-2.5" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
