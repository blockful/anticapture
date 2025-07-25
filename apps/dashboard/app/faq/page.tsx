import { HeaderSidebar } from "@/widgets";
import { FaqSection } from "@/features/faq";
import { HeaderMobile } from "@/widgets/HeaderMobile";

export default function FAQPage() {
  return (
    <div className="bg-surface-background dark flex h-screen">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="sm:hidden">
          <div className="h-[57px] w-full sm:hidden">banana</div>
          <HeaderMobile overlayClassName="top-[57px]" />
        </div>
        <div className="xl4k:min-h-screen flex w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full">
            <FaqSection />
          </div>
        </div>
      </main>
    </div>
  );
}
