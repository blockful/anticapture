"use client";

import { DashboardSection } from "../03-organisms/DashboardSection";

export const HomeTemplate = () => {
  return (
    <main className="mx-auto flex flex-col items-center gap-8 px-8 py-6 lg:gap-16 xl:overflow-auto">
      <DashboardSection />
    </main>
  );
};
