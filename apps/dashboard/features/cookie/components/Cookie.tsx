"use client";

import { useState, useEffect } from "react";
import { CookieIcon } from "@/shared/components/icons";
import { cn } from "@/shared/utils";
import { CookieBackground } from "@/shared/components/icons/CookieBackground";

interface CookieConsentProps {
  className?: string;
}

export const CookieConsent = ({ className }: CookieConsentProps) => {
  const [isVisible, setIsVisible] = useState<boolean | null>(null);

  useEffect(() => {
    // Check localStorage only on client-side
    const consentData = localStorage.getItem("cookie-consent");

    if (consentData) {
      try {
        const { status, timestamp } = JSON.parse(consentData);
        const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000; // 6 months in milliseconds

        // Check if consent is still valid (not expired)
        if (
          timestamp &&
          timestamp > sixMonthsAgo &&
          (status === "accepted" || status === "declined")
        ) {
          setIsVisible(false);
        } else {
          // Consent expired or invalid, remove it and show banner
          localStorage.removeItem("cookie-consent");
          setIsVisible(true);
        }
      } catch (error) {
        // Invalid data format, remove it and show banner
        localStorage.removeItem("cookie-consent");
        setIsVisible(true);
      }
    } else {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    const consentData = {
      status: "accepted",
      timestamp: Date.now(),
    };
    localStorage.setItem("cookie-consent", JSON.stringify(consentData));
    setIsVisible(false);
  };

  const handleDecline = () => {
    const consentData = {
      status: "declined",
      timestamp: Date.now(),
    };
    localStorage.setItem("cookie-consent", JSON.stringify(consentData));
    setIsVisible(false);
  };

  // Don't render anything until we've checked localStorage
  if (isVisible === null || isVisible === false) return null;

  return (
    <div
      className={cn(
        "fixed bottom-7 left-4 right-4 z-50 flex w-auto flex-row items-start gap-4 rounded-lg border border-[#27272A] bg-[#18181B] p-4 shadow-xl sm:left-1/2 sm:right-auto sm:w-[974px] sm:-translate-x-1/2 sm:items-center sm:gap-6",
        className,
      )}
    >
      <div className="flex w-full items-start gap-4 sm:items-center">
        <div className="relative flex size-[116px] flex-shrink-0 items-center justify-center">
          <CookieBackground className="text-brand size-[97px]" />
          <CookieIcon className="text-brand absolute inset-0 left-1/2 top-1/2 size-[56px] -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <div className="text-primary font-mono text-xs uppercase tracking-wider">
            [MISSION_CONTROL]
          </div>
          <div className="text-primary text-lg font-semibold">
            WANT_A_COOKIE?_
          </div>
          <div className="text-secondary text-sm">
            We use cookies to run the site, improve insights, and personalize
            your experience. You can manage your preferences anytime.
          </div>
          <div className="text-dimmed mt-1 text-xs uppercase tracking-wide">
            READ OUR TERMS OF SERVICE
          </div>
        </div>
      </div>
      <div className="flex w-full flex-shrink-0 gap-2 sm:w-auto">
        <button
          onClick={handleAccept}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-2 text-sm font-medium transition-colors"
        >
          [Accept]
        </button>
        <button
          onClick={handleDecline}
          className="bg-background border-border text-secondary hover:bg-accent hover:text-accent-foreground rounded-md border px-6 py-2 text-sm font-medium transition-colors"
        >
          [Decline]
        </button>
      </div>
    </div>
  );
};
