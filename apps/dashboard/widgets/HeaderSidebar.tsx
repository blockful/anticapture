"use client";

import { BarChart4, Bell } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import {
  ButtonMainNav,
  ConnectWallet,
  BottomNavigationButtons,
} from "@/shared/components";
import { Sidebar } from "@/shared/components/design-system/navigation/sidebar";
import { AnticaptureIcon } from "@/shared/components/icons";

export const HeaderSidebar = () => {
  const headerItems = useMemo(
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
    ],
    [],
  );

  return (
    <Sidebar
      isCollapsed
      className="z-50 hidden lg:flex"
      header={
        <Link
          prefetch={true}
          href="/"
          className="border-b-light-dark h-16.25 flex w-full shrink-0 items-center justify-center border-b"
        >
          <AnticaptureIcon className="size-9" />
        </Link>
      }
      footer={
        <div className="flex w-full flex-col">
          <div className="border-middle-dark mx-1.5 flex flex-col gap-2 border-b border-t py-2">
            <BottomNavigationButtons />
          </div>
          <div className="mx-auto flex flex-col px-2 py-4">
            <ConnectWallet label="" className="px-2.5" />
          </div>
        </div>
      }
    >
      {headerItems.map((item) => (
        <ButtonMainNav
          key={item.page || item.label}
          page={item.page || ""}
          icon={item.icon}
          label={item.label}
          isGlobal={item.isGlobal}
        />
      ))}
    </Sidebar>
  );
};
