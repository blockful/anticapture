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
import ConditionalPostHog from "@/shared/services/posthog/ConditionalPostHog";
import UmamiScript from "@/shared/services/umami";
import { resolveDaoIdFromHostname } from "@/shared/utils/whitelabel";

const inter = Inter({ weight: ["400", "500", "600"], subsets: ["latin"] });

const roboto = Roboto_Mono({
  weight: ["500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Anticapture | DAO Governance Security Dashboard",
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
    title: "Anticapture — DAO Governance Security & Risk Analysis Platform",
    description:
      "Anticapture is a DAO governance security platform that quantifies hostile takeover risk, detects governance capture, and tracks resilience metrics across major DAOs.",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Anticapture | DAO Governance Security & Hostile Takeover Prevention",
    description:
      "Monitor governance security, hostile takeover risks, and token distribution across DAOs. Anticapture is the open security framework for decentralized governance.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  const hostname = host.split(":")[0];
  const isWhitelabel = !!resolveDaoIdFromHostname(hostname);

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
        {!isWhitelabel && (
          <script
            dangerouslySetInnerHTML={{
              __html: `if(location.pathname.startsWith('/whitelabel/'))document.documentElement.classList.remove('dark')`,
            }}
          />
        )}
      </head>
      <body
        className={`${inter.className} ${roboto.variable} bg-surface-background`}
      >
        <div
          data-vaul-drawer-wrapper=""
          className="border-border-default mx-auto max-w-screen-2xl overflow-x-hidden border xl:overflow-hidden"
        >
          <GlobalProviders>
            {children}
            <CookieConsent isWhitelabel={isWhitelabel} />
            <HelpPopover />
          </GlobalProviders>
          <Toaster position="bottom-left" reverseOrder={false} />
          <ConditionalPostHog />
          <UmamiScript />
        </div>
      </body>
    </html>
  );
}
