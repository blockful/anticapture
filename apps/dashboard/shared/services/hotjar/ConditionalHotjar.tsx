"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const ConditionalHotjar = () => {
  const [shouldLoadHotjar, setShouldLoadHotjar] = useState(false);

  useEffect(() => {
    const checkCookieConsent = () => {
      const consentData = localStorage.getItem("cookie-consent");

      if (consentData) {
        try {
          const { status, timestamp } = JSON.parse(consentData);
          const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000; // 6 months in milliseconds

          // Only load Hotjar if user accepted cookies and consent is still valid
          if (status === "accepted" && timestamp && timestamp > sixMonthsAgo) {
            setShouldLoadHotjar(true);
          } else {
            setShouldLoadHotjar(false);
            // If consent expired or user declined, remove any existing Hotjar
            if (typeof window !== "undefined") {
              const windowWithHotjar = window as typeof window & {
                hj?: unknown;
                _hjSettings?: unknown;
              };
              if (windowWithHotjar.hj) {
                delete windowWithHotjar.hj;
                delete windowWithHotjar._hjSettings;
              }
            }
          }
        } catch (error) {
          setShouldLoadHotjar(false);
        }
      } else {
        setShouldLoadHotjar(false);
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

  const hotjarScript = `
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:5360544,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  `;

  // Only render Hotjar script in production and when cookies are accepted
  if (process.env.NODE_ENV === "production" && shouldLoadHotjar) {
    return <Script id="hotjar">{hotjarScript}</Script>;
  }

  return null;
};

export default ConditionalHotjar;
