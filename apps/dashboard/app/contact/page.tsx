import type { Metadata } from "next";

import ContactPageClient from "@/app/contact/ContactPageClient";

export const metadata: Metadata = {
  title: "Anticapture - Contact",
  description: "Get in touch with the Anticapture team.",
  openGraph: {
    title: "Anticapture - Contact",
    description: "Get in touch with the Anticapture team.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anticapture - Contact",
    description: "Get in touch with the Anticapture team.",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
