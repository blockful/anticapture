"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart4 } from "lucide-react";
import {
  ButtonHeaderSidebar,
  ConnectWallet,
  BottomNavigationButtons,
} from "@/shared/components";
import { AnticaptureIcon, TelegramIcon } from "@/shared/components/icons";
import { ANTICAPTURE_TELEGRAM_BOT } from "@/shared/constants/social-media";
export const HeaderSidebar = () => {
  const router = useRouter();

  const headerItems = useMemo(
    () => [
      {
        page: "panel",
        label: "Panel",
        icon: BarChart4,
        onClick: () => {
          router.push("/");
        },
      },
      {
        page: "get-security-alerts",
        label: "Alerts",
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

  return (
    <header
      className={`border-light-dark bg-surface-background fixed left-0 top-0 z-50 hidden h-screen w-[68px] border-r sm:block`}
    >
      <div className="flex h-full w-full flex-col items-start">
        <Link
          href="/"
          className="border-b-light-dark flex w-full justify-center border-b p-3"
        >
          <AnticaptureIcon className="size-9" />
        </Link>
        <div className="flex h-full w-full flex-col items-center justify-between">
          <div className="flex h-full flex-col gap-1.5 p-1.5">
            {headerItems.map((item) => (
              <ButtonHeaderSidebar
                key={item.page}
                page={item.page || ""}
                icon={item.icon}
                label={item.label}
                className="text-xs! font-medium! flex-col gap-1"
                onClick={item.onClick}
              />
            ))}
          </div>

          <div className="flex w-full flex-col">
            <div className="border-middle-dark mx-1.5 flex flex-col gap-2 border-b border-t py-2">
              <BottomNavigationButtons isCompact />
            </div>
            <div className="mx-1.5 flex flex-col px-2 py-4">
              <ConnectWallet label="" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
