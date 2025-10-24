import { ProposalSectionSkeleton } from "@/features/governance/components/proposal-overview/ProposalSectionSkeleton";

export default function Loading() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <main className="relative flex-1 overflow-auto pt-[57px] sm:ml-[70px] sm:pt-0">
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full flex-1">
            <ProposalSectionSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}
