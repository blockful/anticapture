import type { Metadata } from "next";

import GlossaryPageClient from "@/app/glossary/GlossaryPageClient";

export const metadata: Metadata = {
  title: "DAO Governance Security Glossary | Anticapture",
  description:
    "Comprehensive glossary of DAO governance security terms — including governance capture, hostile takeover, quorum attack, delegate concentration, and resilience stages.",
  openGraph: {
    title: "DAO Governance Security Glossary | Anticapture",
    description:
      "Comprehensive glossary of DAO governance security terms — including governance capture, hostile takeover, quorum attack, delegate concentration, and resilience stages.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DAO Governance Security Glossary | Anticapture",
    description:
      "Comprehensive glossary of DAO governance security terms — including governance capture, hostile takeover, quorum attack, delegate concentration, and resilience stages.",
  },
};

export default function GlossaryPage() {
  return <GlossaryPageClient />;
}
