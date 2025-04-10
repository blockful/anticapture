"use client";

import { HomeDashboardSection } from "@/components/organisms";
import { SupportDaosSection } from "@/components/organisms/SupportDaosSection";
export const HomeTemplate = () => {
  return (
    <main className="mx-auto flex flex-col items-center gap-6 px-4 py-6 sm:px-8 xl:overflow-auto">
      <HomeDashboardSection />
      <SupportDaosSection />
    </main>
  );
};
