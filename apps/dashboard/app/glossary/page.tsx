import type { Metadata } from "next";

import GlossaryPageClient from "@/app/glossary/GlossaryPageClient";

export const metadata: Metadata = {
  title: "Anticapture - Glossary",
  description: "DAO governance terminology and definitions.",
  openGraph: {
    title: "Anticapture - Glossary",
    description: "DAO governance terminology and definitions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anticapture - Glossary",
    description: "DAO governance terminology and definitions.",
  },
};

export default function GlossaryPage() {
  return <GlossaryPageClient />;
}
