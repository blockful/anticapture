"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { posthogScript } from "@/shared/services/posthog";

type WindowWithPostHog = typeof window & {
  posthog?: {
    opt_out_capturing: () => void;
    capture: (
      event: string,
      properties: Record<string, string | undefined>,
    ) => void;
  };
};

const ConditionalPostHog = () => {
  const [shouldLoadPostHog, setShouldLoadPostHog] = useState(false);

  // Click handler for data-ph-event elements
  const handlePostHogClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest<HTMLAnchorElement>("[data-ph-event]");
    if (!link) return;

    const windowWithPostHog = window as WindowWithPostHog;
    if (windowWithPostHog.posthog?.capture) {
      windowWithPostHog.posthog.capture(link.dataset.phEvent || "", {
        source: link.dataset.phSource,
        href: link.href,
        page: window.location.pathname,
      });
    }
  }, []);

  // Register click event listener when PostHog is loaded
  useEffect(() => {
    if (!shouldLoadPostHog) return;

    document.addEventListener("click", handlePostHogClick);

    return () => {
      document.removeEventListener("click", handlePostHogClick);
    };
  }, [shouldLoadPostHog, handlePostHogClick]);

  useEffect(() => {
    const checkCookieConsent = () => {
      const consentData = localStorage.getItem("cookie-consent");

      if (consentData) {
        try {
          const { status, timestamp } = JSON.parse(consentData);
          const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;

          // Only load PostHog if user accepted cookies and consent is still valid
          if (status === "accepted" && timestamp && timestamp > sixMonthsAgo) {
            setShouldLoadPostHog(true);
            console.log("PostHog loaded");
          } else {
            setShouldLoadPostHog(false);
            // If consent expired or user declined, opt out of PostHog tracking
            if (typeof window !== "undefined") {
              const windowWithPostHog = window as WindowWithPostHog;

              if (windowWithPostHog.posthog?.opt_out_capturing) {
                windowWithPostHog.posthog.opt_out_capturing();
              }
            }
          }
        } catch (error) {
          setShouldLoadPostHog(false);
        }
      } else {
        setShouldLoadPostHog(false);
      }
    };

    // Check initial state
    checkCookieConsent();

    // Listen for storage changes (when user accepts/declines on another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cookie-consent") {
        checkCookieConsent();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events from our cookie banner
    const handleCookieConsentChange = () => {
      checkCookieConsent();
    };

    window.addEventListener("cookieConsentChange", handleCookieConsentChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "cookieConsentChange",
        handleCookieConsentChange,
      );
    };
  }, []);

  // Only render PostHog script in production and when cookies are accepted
  if (process.env.NODE_ENV === "production" && shouldLoadPostHog) {
    return (
      <Script
        id="posthog"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: posthogScript }}
      />
    );
  }

  return null;
};

export default ConditionalPostHog;
