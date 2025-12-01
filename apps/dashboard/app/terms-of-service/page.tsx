import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { TermsSection } from "@/features/terms/TermsSection";

export default function TermsPage() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="sm:hidden">
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
