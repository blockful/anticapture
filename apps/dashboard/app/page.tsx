import type { Metadata } from "next";

import { PanelSection } from "@/features/panel";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

export const metadata: Metadata = {
  title: "Anticapture | DAO Security Dashboard — Governance Risk Overview",
  description:
    "Explore real-time governance security metrics across major DAOs. Anticapture's dashboard tracks hostile takeover risks, token concentration, delegate activity, and resilience scores.",
  openGraph: {
    title: "Anticapture | DAO Security Dashboard — Governance Risk Overview",
    description:
      "Explore real-time governance security metrics across major DAOs. Anticapture's dashboard tracks hostile takeover risks, token concentration, delegate activity, and resilience scores.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anticapture | DAO Security Dashboard — Governance Risk Overview",
    description:
      "Explore real-time governance security metrics across major DAOs. Anticapture's dashboard tracks hostile takeover risks, token concentration, delegate activity, and resilience scores.",
  },
};

export default function Home() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden">
          <HeaderMobile className="fixed! top-0" />
        </div>
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="w-full flex-1">
            <PanelSection />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
