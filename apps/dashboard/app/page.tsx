import { HeaderSidebar } from "@/components/02-molecules";
import { HomeTemplate } from "@/components/04-templates";
import { Metadata } from "next";

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const imageUrl = `${baseUrl}/opengraph-images/default.png`;

export const metadata: Metadata = {
  title: "Anticapture",
  keywords: [
    "governance",
    "dao",
    "data",
    "risk",
    "DAOs",
    "governance security",
  ],
  openGraph: {
    title: "Anticapture",
    description: "Explore and address governance risks in top DAOs.",
    images: [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: `Anticapture Open Graph Image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Anticapture - DAO`,
    description: `Explore and mitigate governance risks in DAO.`,
    images: [imageUrl],
  },
};

export default function Home() {
  return (
    <>
      <HeaderSidebar />
      <HomeTemplate />
    </>
  );
}
