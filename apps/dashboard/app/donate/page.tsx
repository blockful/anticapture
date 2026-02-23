import type { Metadata } from "next";

import { DonationSection } from "@/features/donation";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

export const metadata: Metadata = {
  title: "Anticapture - Donate",
  description: "Support DAO governance security research and development.",
  openGraph: {
    title: "Anticapture - Donate",
    description: "Support DAO governance security research and development.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anticapture - Donate",
    description: "Support DAO governance security research and development.",
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
