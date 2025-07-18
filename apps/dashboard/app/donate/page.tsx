import { HeaderSidebar } from "@/widgets";
import { TheSectionLayout } from "@/shared/components";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { Heart } from "lucide-react";

export default function DonatePage() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="xl4k:min-h-screen flex w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full">
            <TheSectionLayout
              title={SECTIONS_CONSTANTS.donate.title}
              icon={<Heart className="section-layout-icon" />}
              description={SECTIONS_CONSTANTS.donate.description}
              anchorId={SECTIONS_CONSTANTS.donate.anchorId}
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
