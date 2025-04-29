"use client";

import { PanelSection } from "@/components/organisms";
import { SupportDaosSection } from "@/components/organisms/SupportDaosSection";
export const HomeTemplate = () => {
  return (
    <main className="mx-auto flex flex-col items-center sm:gap-6 sm:p-3">
      <PanelSection />
      <SupportDaosSection />
    </main>
  );
};
