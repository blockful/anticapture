import type { Metadata } from "next";

import { TermsSection } from "@/features/terms/TermsSection";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

export const metadata: Metadata = {
  title: "Anticapture - Terms of Service",
  description: "Terms of service for Anticapture platform.",
  openGraph: {
    title: "Anticapture - Terms of Service",
    description: "Terms of service for Anticapture platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anticapture - Terms of Service",
    description: "Terms of service for Anticapture platform.",
  },
};

export default function TermsPage() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden">
          <HeaderMobile overlayClassName="top-[57px]" />
        </div>
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="w-full flex-1">
            <TermsSection />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
