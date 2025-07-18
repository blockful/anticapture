import { HeaderSidebar } from "@/widgets";
import { FaqSection } from "@/features/faq";

export default function FAQPage() {
  return (
    <div className="bg-surface-background dark flex h-screen">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="xl4k:min-h-screen flex w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full">
            <FaqSection />
          </div>
        </div>
      </main>
    </div>
  );
}
