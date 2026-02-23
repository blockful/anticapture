import type { Metadata } from "next";

import { FaqSection } from "@/features/faq";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

export const metadata: Metadata = {
  title: "Anticapture - FAQ",
  description: "Frequently asked questions about DAO governance security.",
  openGraph: {
    title: "Anticapture - FAQ",
    description: "Frequently asked questions about DAO governance security.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anticapture - FAQ",
    description: "Frequently asked questions about DAO governance security.",
  },
};

export default function FAQPage() {
  return (
    <div className="bg-surface-background dark flex h-screen">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden">
          <div className="h-[57px] w-full lg:hidden" />
          <HeaderMobile overlayClassName="top-[57px]" />
        </div>
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="w-full flex-1">
            <FaqSection />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
