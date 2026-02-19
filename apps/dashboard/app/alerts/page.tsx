import type { Metadata } from "next";
import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { AlertsSection } from "@/features/alerts";

export const metadata: Metadata = {
  title: "Anticapture - Alerts",
  description: "Stay updated with governance alerts and notifications.",
  openGraph: {
    title: "Anticapture - Alerts",
    description: "Stay updated with governance alerts and notifications.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anticapture - Alerts",
    description: "Stay updated with governance alerts and notifications.",
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
