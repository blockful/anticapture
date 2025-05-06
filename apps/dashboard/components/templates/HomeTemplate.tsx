"use client";

import { PanelSection } from "@/components/organisms";
import { SupportDaosSection } from "@/components/organisms/SupportDaosSection";
export const HomeTemplate = () => {
  return (
    <main className="page-sections-gap mx-auto flex flex-col items-center sm:p-3">
      <PanelSection />
      <SupportDaosSection />
    </main>
  );
};
