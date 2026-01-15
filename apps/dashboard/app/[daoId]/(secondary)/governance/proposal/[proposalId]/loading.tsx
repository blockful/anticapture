import { ProposalSectionSkeleton } from "@/features/governance/components/proposal-overview/ProposalSectionSkeleton";

export default function Loading() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <main className="relative flex-1 overflow-auto pt-[57px] sm:pt-0">
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="w-full max-w-screen-2xl flex-1">
            <ProposalSectionSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}
