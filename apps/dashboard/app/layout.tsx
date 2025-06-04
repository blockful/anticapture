import "@/app/globals.css";
import "tailwindcss";

import type { Metadata } from "next";
import { GlobalProviders } from "@/shared/providers/GlobalProviders";
import { ReactNode } from "react";
import HotjarScript from "@/shared/services/hotjar";
import { Inter, Roboto_Mono } from "next/font/google";

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

const imageUrl = `${baseUrl}/opengraph-images/default.png`;

export const metadata: Metadata = {
  title: "Anticapture",
  keywords: [
    "governance",
    "dao",
    "data",
    "risk",
    "DAOs",
    "governance security",
  ],
  openGraph: {
    title: "Anticapture",
    description: "Explore and address governance risks in top DAOs.",
    images: [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: `Anticapture Open Graph Image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Anticapture - DAO`,
    description: `Explore and mitigate governance risks in DAO.`,
    images: [imageUrl],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1 viewport-fit=cover"
        />
        <HotjarScript />
      </head>
      <body
        className={`${inter.className} ${roboto.variable} overflow-x-hidden xl:overflow-hidden`}
      >
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
