import { DaoIdEnum } from "@/shared/types/daos";
import { createDaoSectionOgImage } from "@/shared/og";

export const alt = "Anticapture Governance Proposal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ daoId: string; proposalId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;

  return await createDaoSectionOgImage({
    daoId: daoIdEnum,
    sectionTitle: "<governance>",
  });
}
