import { DaoIdEnum } from "@/shared/types/daos";
import { createDaoSectionOgImage } from "@/shared/og";
import { SECTION_OG_CONFIG } from "@/shared/og/section-config";

export const alt = "Anticapture Resilience Stages";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const sectionTitle =
    SECTION_OG_CONFIG["resilience-stages"] ?? "Resilience Stages";

  return await createDaoSectionOgImage({
    daoId: daoIdEnum,
    sectionTitle,
  });
}
