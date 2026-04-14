import type { Metadata } from "next";

import { FaqSection } from "@/features/faq";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

export const metadata: Metadata = {
  title: "DAO Governance Security FAQ | Anticapture",
  description:
    "Answers to common questions about DAO governance security, hostile takeover risks, governance capture, resilience metrics, and how Anticapture monitors and protects decentralized protocols.",
  openGraph: {
    title: "DAO Governance Security FAQ | Anticapture",
    description:
      "Answers to common questions about DAO governance security, hostile takeover risks, governance capture, resilience metrics, and how Anticapture monitors and protects decentralized protocols.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DAO Governance Security FAQ | Anticapture",
    description:
      "Answers to common questions about DAO governance security, hostile takeover risks, governance capture, resilience metrics, and how Anticapture monitors and protects decentralized protocols.",
  },
};

export default function FAQPage() {
  return (
    <div className="bg-surface-background dark flex h-screen">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden">
          <HeaderMobile className="fixed! top-0" />
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
