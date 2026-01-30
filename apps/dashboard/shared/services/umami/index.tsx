"use client";

import Script from "next/script";
import { FC } from "react";

const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

const UmamiScript: FC = () => {
  // Umami always loads, regardless of cookie consent
  if (process.env.NODE_ENV === "production") {
    if (!UMAMI_WEBSITE_ID) {
      console.error(
        "Umami website ID is not configured. Set NEXT_PUBLIC_UMAMI_WEBSITE_ID.",
      );
      return null;
    }

    return (
      <Script
        src="https://cloud.umami.is/script.js"
        data-website-id={UMAMI_WEBSITE_ID}
        data-tag="umami-eu"
        strategy="afterInteractive"
      />
    );
  }

  return null;
};

export default UmamiScript;
