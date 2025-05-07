"use client";

import { PanelSection } from "@/components/organisms";
import { SupportDaosSection } from "@/components/organisms/SupportDaosSection";
export const HomeTemplate = () => {
  return (
    <main className="flex flex-col items-center">
      <PanelSection />
      <SupportDaosSection />
    </main>
  );
};
