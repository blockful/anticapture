"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";

import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { BulletDivider } from "@/shared/components/design-system/section";
import { cn } from "@/shared/utils/cn";

import type { BannerAlertProps } from "@/shared/components/design-system/alerts/types";

const mapVariantToColor = {
  default: "bg-surface-banner-default",
  highlight: "bg-surface-banner-highlight",
};

export const BannerAlert = ({
  icon,
  text,
  link,
  links,
  storageKey,
  variant = "default",
  persist = true,
  className,
}: BannerAlertProps) => {
  // Initialize as null to prevent rendering during hydration
  const [isVisible, setIsVisible] = useState<boolean | null>(null);

  useEffect(() => {
    if (persist) {
      const isDismissed = localStorage.getItem(
        `banner-dismissed-${storageKey}`,
      );
      setIsVisible(isDismissed !== "true");
    } else {
      setIsVisible(true);
    }
  }, [storageKey, persist]);

  const onClose = () => {
    if (persist) {
      localStorage.setItem(`banner-dismissed-${storageKey}`, "true");
    }
    setIsVisible(false);
  };

  // Don't render anything until we've checked localStorage
  if (isVisible === null || isVisible === false) return null;

  const allLinks = links ?? (link ? [link] : []);

  return (
    <div
      className={cn(
        "text-tangerine flex w-full items-center justify-between gap-2 px-3 py-1 text-sm",
        mapVariantToColor[variant],
        className,
      )}
    >
      <div className="flex items-center gap-2 tracking-wider lg:flex-row">
        <div className="flex flex-wrap items-center gap-1 lg:flex-row">
          <div className="flex gap-2 font-mono text-xs uppercase text-white">
            <div className="shrink-0">{icon}</div>
            <div className="flex flex-wrap items-center gap-2">
              {text}
              {allLinks.length > 0 && (
                <div className="flex items-center gap-2">
                  {allLinks.map((l, i) => (
                    <div key={l.url} className="flex items-center gap-2">
                      {i > 0 && <BulletDivider />}
                      <DefaultLink
                        href={l.url}
                        openInNewTab={l.openInNewTab ?? true}
                        variant="highlight"
                      >
                        {l.text}
                      </DefaultLink>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <IconButton
        onClick={onClose}
        variant="ghost"
        aria-label="Close message"
        size="sm"
        icon={X}
      />
    </div>
  );
};
