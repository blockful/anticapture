"use client";

import { ChevronRight, X } from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { cn } from "@/shared/utils";
import { IconButton } from "@/shared/components";

interface BannerAlertProps {
  icon: ReactNode;
  text: string;
  link?: {
    url: string;
    text: string;
  };
  storageKey: string;
  variant?: "default" | "highlight";
}

const mapVariantToColor = {
  default: "bg-[#2C1810]",
  highlight: "bg-[#18181B] ",
};

export const BannerAlert = ({
  icon,
  text,
  link,
  storageKey,
  variant = "default",
}: BannerAlertProps) => {
  // Initialize as null to prevent rendering during hydration
  const [isVisible, setIsVisible] = useState<boolean | null>(null);

  useEffect(() => {
    // Check localStorage only on client-side
    const isDismissed = localStorage.getItem(`banner-dismissed-${storageKey}`);
    setIsVisible(isDismissed !== "true");
  }, [storageKey]);

  const onClose = () => {
    localStorage.setItem(`banner-dismissed-${storageKey}`, "true");
    setIsVisible(false);
  };

  // Don't render anything until we've checked localStorage
  if (isVisible === null || isVisible === false) return null;

  return (
    <div
      className={cn(
        "text-tangerine flex w-full items-center justify-between gap-2 px-3 py-2 text-sm",
        mapVariantToColor[variant],
      )}
    >
      <div className="flex items-center gap-2 tracking-wider sm:flex-row">
        <div className="flex flex-wrap items-center gap-1 sm:flex-row">
          <div className="flex gap-2 font-mono text-xs uppercase text-white">
            <div className="flex-shrink-0">{icon}</div>
            <div className="flex flex-wrap gap-1">
              {text}
              {link && (
                <DefaultLink
                  href={link.url}
                  openInNewTab
                  variant="highlight"
                  className="flex items-center gap-1"
                >
                  {link.text}
                  <ChevronRight className="size-4" />
                </DefaultLink>
              )}
            </div>
          </div>
        </div>
      </div>

      <IconButton
        onClick={onClose}
        variant="ghost"
        className="hover:text-tangerine/80"
        aria-label="Close message"
        size="sm"
        icon={X}
      />
    </div>
  );
};
