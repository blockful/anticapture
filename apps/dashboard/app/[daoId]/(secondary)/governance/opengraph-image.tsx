import { createDaoSectionOgImage } from "@/shared/og";
import { DaoIdEnum } from "@/shared/types/daos";

export const alt = "Anticapture Governance";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;

  return await createDaoSectionOgImage({
    daoId: daoIdEnum,
    sectionTitle: "<governance>",
  });
}
