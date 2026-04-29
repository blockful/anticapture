"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/shared/components/design-system/footer/Footer";

export const ConditionalFooter = () => {
  const pathname = usePathname();
  if (pathname?.endsWith("/proposals/new")) return null;
  return <Footer />;
};
