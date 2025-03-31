"use client";

import { HomeDashboardSection, ShowSupportSection } from "@/components/organisms";

export const HomeTemplate = () => {
  return (
    <main className="mx-auto flex flex-col items-center gap-8 px-4 py-6 sm:px-8 lg:gap-16 xl:overflow-auto">
      <HomeDashboardSection />
      <ShowSupportSection />
    </main>
  );
};
