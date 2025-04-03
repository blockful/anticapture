import "./globals.css";
import "tailwindcss";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GlobalProviders } from "@/components/providers/GlobalProviders";
import { ReactNode } from "react";
import HotjarScript from "@/hotjar";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <head>
        <HotjarScript />
      </head>
      <body
        className={`${inter.className} overflow-x-hidden bg-darkest xl:overflow-hidden`}
      >
        <GlobalProviders>
          <div className="max-h-screen overflow-auto xl:ml-[330px]">
            {children}
          </div>
        </GlobalProviders>
      </body>
    </html>
  );
}
