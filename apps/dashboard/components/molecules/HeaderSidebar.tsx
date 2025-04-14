"use client";

import {
  AnticaptureIcon,
  ButtonHeaderSidebar,
  ConnectWallet,
} from "@/components/atoms";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { Banana, Star, BarChart4 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

export const HeaderSidebar = () => {
  const router = useRouter();

  const headerItems = useMemo(
    () => [
      {
        anchorId: SECTIONS_CONSTANTS.panel.anchorId,
        label: "Panel",
        icon: BarChart4,
        onClick: () => {
          sessionStorage.setItem("scrollToSection", "panel");
          router.push("/");
        },
      },
      {
        anchorId: SECTIONS_CONSTANTS.panel.anchorId,
        label: "Other",
        icon: Star,
      },
      {
        anchorId: SECTIONS_CONSTANTS.panel.anchorId,
        label: "Other",
        icon: Banana,
      },
    ],
    [],
  );

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
            {headerItems.map((item) => (
              <ButtonHeaderSidebar
                key={item.anchorId}
                anchorId={item.anchorId}
                icon={item.icon}
                label={item.label}
                className="flex-col gap-1"
                onClick={() => {
                  router.push(`/${item.anchorId ? `#${item.anchorId}` : ""}`);
                }}
              />
            ))}
          </div>
          <div className="flex px-3 py-4">
            <ConnectWallet label="" />
          </div>
        </div>
      </div>
    </header>
  );
};
