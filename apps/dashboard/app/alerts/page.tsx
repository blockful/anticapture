import type { Metadata } from "next";

import { AlertsSection } from "@/features/alerts";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

export const metadata: Metadata = {
  title: "DAO Governance Security Alerts | Anticapture",
  description:
    "Receive real-time alerts on governance security threats, hostile takeover attempts, abnormal voting patterns, and token concentration changes across monitored DAOs.",
  openGraph: {
    title: "DAO Governance Security Alerts | Anticapture",
    description:
      "Receive real-time alerts on governance security threats, hostile takeover attempts, abnormal voting patterns, and token concentration changes across monitored DAOs.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DAO Governance Security Alerts | Anticapture",
    description:
      "Receive real-time alerts on governance security threats, hostile takeover attempts, abnormal voting patterns, and token concentration changes across monitored DAOs.",
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
            <AlertsSection />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
