import type { Metadata } from "next";

import ContactPageClient from "@/app/contact/ContactPageClient";

export const metadata: Metadata = {
  title: "Contact Anticapture | DAO Governance Security Team",
  description:
    "Contact the Anticapture team for governance security research partnerships, DAO integrations, or questions about hostile takeover risk analysis and the governance security framework.",
  openGraph: {
    title: "Contact Anticapture | DAO Governance Security Team",
    description:
      "Contact the Anticapture team for governance security research partnerships, DAO integrations, or questions about hostile takeover risk analysis and the governance security framework.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Anticapture | DAO Governance Security Team",
    description:
      "Contact the Anticapture team for governance security research partnerships, DAO integrations, or questions about hostile takeover risk analysis and the governance security framework.",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
