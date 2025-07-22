import { HeaderSidebar } from "@/widgets";
import { TheSectionLayout } from "@/shared/components";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { BookOpen } from "lucide-react";

export default function GlossaryPage() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="xl4k:min-h-screen flex w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full">
            <TheSectionLayout
              title={SECTIONS_CONSTANTS.glossary.title}
              icon={<BookOpen className="section-layout-icon" />}
              description={SECTIONS_CONSTANTS.glossary.description}
              anchorId={SECTIONS_CONSTANTS.glossary.anchorId}
              className="bg-surface-background! mt-[56px]! sm:mt-0!"
            >
              <div className="text-secondary">glossary</div>
            </TheSectionLayout>
          </div>
        </div>
      </main>
    </div>
  );
}
