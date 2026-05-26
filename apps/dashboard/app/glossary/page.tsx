import type { Metadata } from "next";

import GlossaryPageClient from "@/app/glossary/GlossaryPageClient";
import {
  getAllTerms,
  SAMPLE_GLOSSARY_DATA,
} from "@/features/glossary/glossary";
import { JsonLd } from "@/shared/seo/JsonLd";
import { getSiteUrl } from "@/shared/seo/site";

export const metadata: Metadata = {
  title: "DAO Governance Security Glossary | Anticapture",
  description:
    "Comprehensive glossary of DAO governance security terms - including governance capture, hostile takeover, quorum attack, delegate concentration, and resilience stages.",
  openGraph: {
    title: "DAO Governance Security Glossary | Anticapture",
    description:
      "Comprehensive glossary of DAO governance security terms - including governance capture, hostile takeover, quorum attack, delegate concentration, and resilience stages.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DAO Governance Security Glossary | Anticapture",
    description:
      "Comprehensive glossary of DAO governance security terms - including governance capture, hostile takeover, quorum attack, delegate concentration, and resilience stages.",
  },
};

const glossarySchema = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  name: "Anticapture DAO Governance Security Glossary",
  description:
    "Definitions for DAO governance security terms used across the Anticapture framework.",
  url: `${getSiteUrl()}/glossary`,
  hasDefinedTerm: getAllTerms(SAMPLE_GLOSSARY_DATA).map((term) => ({
    "@type": "DefinedTerm",
    name: term.title.trim(),
    description: term.definition,
    inDefinedTermSet: `${getSiteUrl()}/glossary`,
  })),
};

export default function GlossaryPage() {
  return (
    <>
      <JsonLd data={glossarySchema} />
      <GlossaryPageClient />
    </>
  );
}
