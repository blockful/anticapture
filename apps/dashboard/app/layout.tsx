import "./globals.css";
import "tailwindcss";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GlobalProviders } from "@/components/providers/global-provider";
import { ReactNode } from "react";
import { HeaderSidebar } from "@/components/02-molecules";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DefenDAO",
  description: "DefenDAO Governance dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} overflow-x-hidden bg-darkest xl:overflow-hidden`}
      >
        <GlobalProviders>
          <HeaderSidebar />
          <div className="xl:ml-[330px] xl:max-h-screen xl:overflow-auto">
            {children}
          </div>
        </GlobalProviders>
      </body>
    </html>
  );
}
