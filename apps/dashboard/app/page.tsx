import type { Metadata } from "next";
import { HeaderMobile } from "@/widgets/HeaderMobile";
import { HomeTemplate } from "@/templates";
import { HeaderSidebar } from "@/widgets";
import { Footer } from "@/shared/components/design-system/footer/Footer";

export const metadata: Metadata = {
  title: "Anticapture - Panel",
  description: "Explore and address governance risks in top DAOs.",
  openGraph: {
    title: "Anticapture - Panel",
    description: "Explore and address governance risks in top DAOs.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anticapture - Panel",
    description: "Explore and address governance risks in top DAOs.",
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
            <HomeTemplate />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
