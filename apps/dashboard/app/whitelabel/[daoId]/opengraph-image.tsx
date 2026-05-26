import { createWhitelabelOgImage } from "@/shared/og/whitelabel-og-image";
import { toDaoIdEnum } from "@/shared/types/daos";

export const alt = "DAO Governance";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = toDaoIdEnum(daoId);

  if (!daoIdEnum) return new Response(null, { status: 404 });

  return createWhitelabelOgImage(daoIdEnum);
}
