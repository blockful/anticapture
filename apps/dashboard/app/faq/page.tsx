import { HeaderSidebar } from "@/widgets";
import { TheSectionLayout } from "@/shared/components";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { HelpCircle } from "lucide-react";

export default function FAQPage() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="xl4k:min-h-screen flex w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full">
            <TheSectionLayout
              title={SECTIONS_CONSTANTS.faq.title}
              icon={<HelpCircle className="section-layout-icon" />}
              description={SECTIONS_CONSTANTS.faq.description}
              anchorId={SECTIONS_CONSTANTS.faq.anchorId}
              className="bg-surface-background! mt-[56px]! sm:mt-0!"
            >
              <div className="text-secondary"></div>
            </TheSectionLayout>
          </div>
        </div>
      </main>
    </div>
  );
}
