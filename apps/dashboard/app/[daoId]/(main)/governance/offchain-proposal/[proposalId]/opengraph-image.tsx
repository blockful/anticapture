import { createDaoSectionOgImage } from "@/shared/og";
import type { DaoIdEnum } from "@/shared/types/daos";

export const alt = "Anticapture Offchain Governance Proposal";
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
    sectionTitle: "<offchain proposal>",
  });
}
