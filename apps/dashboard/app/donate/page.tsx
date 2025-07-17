import { HeaderSidebar } from "@/widgets";
import { DonationSection } from "@/features/donation";

export default function DonatePage() {
  return (
    <div className="bg-surface-background flex h-screen">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="xl4k:min-h-screen flex w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full">
            <DonationSection />
          </div>
        </div>
      </main>
    </div>
  );
}
