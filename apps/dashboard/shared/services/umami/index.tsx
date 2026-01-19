"use client";

import Script from "next/script";
import { FC } from "react";

const UmamiScript: FC = () => {
  // Umami always loads, regardless of cookie consent
  if (process.env.NODE_ENV === "production") {
    return (
      <Script
        src="https://cloud.umami.is/script.js"
        data-website-id="d398045b-7a0c-4fc6-b448-565e1d753699"
        data-tag="umami-eu"
        strategy="afterInteractive"
        onLoad={() => console.log("Umami loaded")}
      />
    );
  }

  return null;
};

export default UmamiScript;
