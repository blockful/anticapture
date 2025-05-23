import { ArrowRight, X } from "lucide-react";
import { ReactNode, useState, useEffect } from "react";

interface BannerAlertProps {
  icon: ReactNode;
  text: string;
  link: {
    url: string;
    text: string;
  };
  storageKey: string;
}

const BannerAlert = ({ icon, text, link, storageKey }: BannerAlertProps) => {
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
    <div className="flex w-full items-center justify-between gap-2 bg-[#2C1810] px-4 py-3 text-sm text-tangerine">
      <div className="flex items-center gap-3 tracking-wider sm:flex-row">
        {icon}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex gap-3 text-white">{text}</div>
          <div className="flex items-center gap-3">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-normal hover:text-tangerine/80"
            >
              {link.text}
            </a>
            <ArrowRight className="size-4" />
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="text-tangerine hover:text-tangerine/80"
        aria-label="Close message"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

export default BannerAlert;
