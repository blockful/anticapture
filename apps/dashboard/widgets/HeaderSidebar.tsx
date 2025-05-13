"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { BarChart4 } from "lucide-react";
import { ButtonHeaderSidebar, ConnectWallet } from "@/components/atoms";
import { AnticaptureIcon } from "@/shared/icons";
export const HeaderSidebar = () => {
  const router = useRouter();

  const headerItems = useMemo(
    () => [
      {
        anchorId: SECTIONS_CONSTANTS.panel.anchorId,
        label: SECTIONS_CONSTANTS.panel.title,
        icon: BarChart4,
        onClick: () => {
          sessionStorage.setItem(
            "scrollToSection",
            SECTIONS_CONSTANTS.panel.anchorId,
          );
          router.push("/");
        },
      },
      // {
      //   anchorId: SECTIONS_CONSTANTS.alerts.anchorId,
      //   label: SECTIONS_CONSTANTS.alerts.title,
      //   icon: TelegramIcon,
      // },
    ],
    [router],
  );

  return (
    <header
      className={`fixed left-0 top-0 z-50 hidden h-screen w-[68px] border-r border-lightDark bg-darkest sm:block`}
    >
      <div className="flex h-full w-full flex-col items-start">
        <Link
          href="/"
          className="flex w-full justify-center border-b border-b-lightDark p-3"
        >
          <AnticaptureIcon className="size-9" />
        </Link>
        <div className="flex h-full w-full flex-col items-center justify-between">
          <div className="flex h-full flex-col gap-1.5 p-1.5">
            {headerItems.map((item) => (
              <ButtonHeaderSidebar
                key={item.anchorId}
                anchorId={item.anchorId || ""}
                icon={item.icon}
                label={item.label}
                className="flex-col gap-1 !text-xs !font-medium"
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
