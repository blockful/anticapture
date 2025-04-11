"use client";

import { AnticaptureIcon, ConnectWallet } from "@/components/atoms";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { Banana, BarChart4, Star } from "lucide-react";
import Link from "next/link";

interface HeaderSidebarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
}

export const HeaderSidebar = () => {
  const HeaderSidebarButton = ({
    icon,
    label,
    ...props
  }: HeaderSidebarButtonProps) => {
    return (
      <button
        className="flex w-full flex-col items-center gap-1 rounded-md bg-lightDark p-2"
        {...props}
      >
        {icon}
        <p className="text-xs font-medium text-[#FAFAFA]">{label}</p>
      </button>
    );
  };

  return (
    <header className="fixed left-0 top-0 z-50 hidden h-screen w-[72px] border-r border-lightDark sm:block">
      <div className="flex h-full w-full flex-col items-start">
        <Link
          href="/"
          className="flex w-full justify-center border-b border-b-lightDark p-3"
        >
          <AnticaptureIcon className="size-9" />
        </Link>
        <div className="flex h-full w-full flex-col justify-between">
          <div className="flex h-full flex-col gap-1.5 p-1.5">
            <HeaderSidebarButton
              icon={<BarChart4 className="size-4 text-foreground" />}
              label="Panel"
              onClick={() => {
                const dashboardAnchorSection = document.getElementById(
                  SECTIONS_CONSTANTS.panel.anchorId,
                );

                dashboardAnchorSection?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            />
            <HeaderSidebarButton
              icon={<Star className="size-4 text-foreground" />}
              label="Other"
            />
            <HeaderSidebarButton
              icon={<Banana className="size-4 text-foreground" />}
              label="Other"
            />
          </div>
          <div className="flex px-3 py-4">
            <ConnectWallet label="" />
          </div>
        </div>
      </div>
    </header>
  );
};
