import type { Metadata } from "next";
import { HeaderMobile } from "@/widgets/HeaderMobile";
import { HeaderSidebar } from "@/widgets";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { PanelSection } from "@/features/panel";

const metadataDescription =
  "Anticapture | Monitor DAO governance risk. Track delegation shifts, voting power concentration, and onchain risk indicators across Ethereum DAOs.";

export const metadata: Metadata = {
  title: "Anticapture - Panel",
  description: metadataDescription,
  openGraph: {
    title: "Anticapture - Panel",
    description: metadataDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "Anticapture - Panel",
    description: metadataDescription,
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
