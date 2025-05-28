import { ChevronRight, X } from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { cn } from "@/shared/utils";

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

const BannerAlert = ({
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
        "text-tangerine flex w-full items-center justify-between gap-2 p-2 text-sm",
        mapVariantToColor[variant],
      )}
    >
      <div className="flex items-center gap-2 tracking-wider sm:flex-row">
        {icon}
        <div className="flex flex-col items-center gap-1 sm:flex-row">
          <div className="flex gap-3 text-xs text-white uppercase">{text}</div>
          {link && (
            <DefaultLink href={link.url} openInNewTab variant="highlight">
              {link.text}
              <ChevronRight className="size-4" />
            </DefaultLink>
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="hover:text-tangerine/80 p-1 text-white transition-colors duration-300 hover:cursor-pointer"
        aria-label="Close message"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

export default BannerAlert;
