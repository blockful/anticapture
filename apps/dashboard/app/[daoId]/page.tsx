import type { Metadata } from "next";
import { DaoTemplate } from "@/components/04-templates";
import { DaoIdEnum, SUPPORTED_DAO_NAMES } from "@/lib/types/daos";

type Props = {
  params: { daoId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const ogImage: Record<DaoIdEnum, string> = {
    ENS: `${baseUrl}/opengraph-images/ENS.png`,
    UNI: `${baseUrl}/opengraph-images/UNI.png`,
  };

  const imageUrl = ogImage[daoId] || `${baseUrl}/opengraph-images/default.png`;

  return {
    title: `${!SUPPORTED_DAO_NAMES.includes(daoId) ? "Anticapture - DAO Not Found" : `Anticapture - ${daoId} DAO`}`,
    description: `Explore and mitigate governance risks in ${daoId} DAO.`,
    openGraph: {
      title: `Anticapture - ${daoId} DAO`,
      description: `Explore and mitigate governance risks in ${daoId} DAO.`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${daoId} DAO Open Graph Image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Anticapture - ${daoId} DAO`,
      description: `Explore and mitigate governance risks in ${daoId} DAO.`,
      images: [imageUrl],
    },
  };
}

export default function DaoPage({ params }: { params: { daoId: string } }) {
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  return (
    <div className="mx-auto flex flex-col items-center gap-8 px-8 py-6 lg:gap-16 xl:overflow-auto">
      <DaoTemplate
        params={{
          daoId: daoId,
        }}
      />
    </div>
  );
}
