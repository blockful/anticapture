import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";

import { toDaoIdEnum } from "@/shared/types/daos";
import {
  WHITELABEL_ROUTES,
  resolveWhitelabelDaoIdFromHeaders,
} from "@/shared/utils/whitelabel";

type Props = {
  params: Promise<{ daoId: string; address: string }>;
};

/**
 * Old delegate route: it only opened the profile drawer over the delegates
 * table. The address profile page replaced it. On the DAO's own domain the
 * middleware already redirects; this covers the internal path.
 */
export default async function LegacyWhitelabelDelegatePage({ params }: Props) {
  const { daoId, address } = await params;
  const daoIdEnum = toDaoIdEnum(daoId);

  if (!daoIdEnum) notFound();

  const isOnDaoDomain =
    resolveWhitelabelDaoIdFromHeaders(await headers()) === daoIdEnum;
  const route = `${WHITELABEL_ROUTES.address}/${address}`;

  permanentRedirect(
    isOnDaoDomain
      ? `/${route}`
      : `/whitelabel/${daoIdEnum.toLowerCase()}/${route}`,
  );
}
