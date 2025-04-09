"use client";

import { HomeDashboardSection } from "@/components/organisms";
import { ReachOutToUsCard } from "@/components/molecules";

export const HomeTemplate = () => {
  return (
    <main className="mx-auto flex flex-col items-center gap-6 px-4 py-6 sm:px-8 xl:overflow-auto">
      <HomeDashboardSection />
      <ReachOutToUsCard />
    </main>
  );
};
