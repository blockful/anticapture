import type { Metadata } from "next";

import { DonationSection } from "@/features/donation";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

export const metadata: Metadata = {
  title: "Support DAO Governance Security Research | Anticapture",
  description:
    "Support Anticapture's open-source research on DAO governance security, hostile takeover prevention, and governance capture detection. Help keep the security framework free and open.",
  openGraph: {
    title: "Support DAO Governance Security Research | Anticapture",
    description:
      "Support Anticapture's open-source research on DAO governance security, hostile takeover prevention, and governance capture detection. Help keep the security framework free and open.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Support DAO Governance Security Research | Anticapture",
    description:
      "Support Anticapture's open-source research on DAO governance security, hostile takeover prevention, and governance capture detection. Help keep the security framework free and open.",
  },
};

export default function DonatePage() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden">
          <HeaderMobile overlayClassName="top-[57px]" />
        </div>
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="w-full flex-1">
            <DonationSection />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
