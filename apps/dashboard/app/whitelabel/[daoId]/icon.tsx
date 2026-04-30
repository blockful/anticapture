import { ImageResponse } from "next/og";

import daoConfigByDaoId from "@/shared/dao-config";
import { toDaoIdEnum } from "@/shared/types/daos";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = toDaoIdEnum(daoId);

  if (!daoIdEnum) return new Response(null, { status: 404 });

  const config = daoConfigByDaoId[daoIdEnum];
  const DaoIcon = config?.icon;

  if (!DaoIcon) return new Response(null, { status: 404 });

  return new ImageResponse(
    <DaoIcon showBackground style={{ width: 32, height: 32 }} />,
    size,
  );
}
