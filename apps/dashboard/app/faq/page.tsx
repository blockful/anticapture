import { HeaderSidebar } from "@/widgets";
import { FaqSection } from "@/features/faq";
import { HeaderMobile } from "@/widgets/HeaderMobile";
import { Footer } from "@/shared/components/design-system/footer/Footer";

export default function FAQPage() {
  return (
    <div className="bg-surface-background dark flex h-screen">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="sm:hidden">
          <div className="h-[57px] w-full sm:hidden" />
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
