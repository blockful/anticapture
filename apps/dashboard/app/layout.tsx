import "./globals.css";
import "tailwindcss";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GlobalProviders } from "@/components/providers/GlobalProviders";
import { ReactNode } from "react";

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
          <div className="xl:ml-[330px] xl:max-h-screen xl:overflow-auto">
            {children}
          </div>
        </GlobalProviders>
      </body>
    </html>
  );
}
