import "@/app/globals.css";
import "tailwindcss";
import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

import { CookieConsent } from "@/features/cookie";
import { HelpPopover } from "@/shared/components";
import { GlobalProviders } from "@/shared/providers/GlobalProviders";
import { JsonLd } from "@/shared/seo/JsonLd";
import {
  ORGANIZATION_ALT_NAME,
  ORGANIZATION_NAME,
  SITE_DESCRIPTION,
  SITE_TAGLINE,
  getSiteUrl,
} from "@/shared/seo/site";
import ConditionalPostHog from "@/shared/services/posthog/ConditionalPostHog";
import UmamiScript from "@/shared/services/umami";
import { ALL_DAOS, type DaoIdEnum } from "@/shared/types/daos";
import { resolveDaoIdFromHostname } from "@/shared/utils/whitelabel";

const isForceDaoSet = () => {
  const forced = process.env.FORCE_DAO?.trim().toUpperCase();
  return !!forced && ALL_DAOS.includes(forced as DaoIdEnum);
};

const inter = Inter({ weight: ["400", "500", "600"], subsets: ["latin"] });

const roboto = Roboto_Mono({
  weight: ["500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: `Anticapture | ${SITE_TAGLINE}`,
  keywords: [
    "DAO governance security",
    "hostile takeover prevention",
    "governance capture",
    "governance risk analysis",
    "DAO security framework",
    "token distribution",
    "delegate monitoring",
    "resilience metrics",
    "DeFi governance",
    "on-chain governance security",
  ],
  openGraph: {
    title: "Anticapture | DAO Governance Security & Risk Analysis Platform",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Anticapture | DAO Governance Security & Hostile Takeover Prevention",
    description:
      "Monitor governance security, hostile takeover risks, and token distribution across DAOs. Anticapture is the open security framework for decentralized governance.",
  },
};

const rootSchemas = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION_NAME,
    alternateName: ORGANIZATION_ALT_NAME,
    url: baseUrl,
    sameAs: ["https://x.com/anticapture_", "https://blockful.io"],
    description: SITE_DESCRIPTION,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Anticapture",
    url: baseUrl,
    description: SITE_DESCRIPTION,
  },
];

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  const hostname = host.split(":")[0];
  const pathname =
    headersList.get("x-invoke-path") ?? headersList.get("next-url") ?? "";
  const isWhitelabel =
    !!resolveDaoIdFromHostname(hostname) ||
    isForceDaoSet() ||
    pathname.startsWith("/whitelabel/");

  return (
    <html
      lang="en"
      className={isWhitelabel ? undefined : "dark"}
      suppressHydrationWarning
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body
        className={`${inter.className} ${roboto.variable} bg-surface-background`}
      >
        <JsonLd data={rootSchemas} />
        <div
          data-vaul-drawer-wrapper=""
          className="border-border-default mx-auto max-w-screen-2xl overflow-x-hidden border xl:overflow-hidden"
        >
          <GlobalProviders>
            {children}
            <CookieConsent isWhitelabel={isWhitelabel} />
            <HelpPopover isWhitelabel={isWhitelabel} />
          </GlobalProviders>
          <Toaster position="bottom-left" reverseOrder={false} />
          <ConditionalPostHog />
          <UmamiScript />
        </div>
      </body>
    </html>
  );
}
