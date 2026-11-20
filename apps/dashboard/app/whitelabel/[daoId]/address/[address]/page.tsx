import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";

import { AddressProfile } from "@/features/holders-and-delegates/profile/AddressProfile";
import { buildAddressProfileMetadata } from "@/features/holders-and-delegates/profile/utils/addressProfileMetadata";
import { resolveProfileAddressParam } from "@/features/holders-and-delegates/profile/utils/resolveProfileAddress";
import type { DaoIdEnum } from "@/shared/types/daos";
import { toDaoIdEnum } from "@/shared/types/daos";
import {
  WHITELABEL_ROUTES,
  resolveWhitelabelDaoIdFromHeaders,
} from "@/shared/utils/whitelabel";

type Props = {
  params: Promise<{ daoId: string; address: string }>;
};

// On the DAO's own domain the middleware hides the `/whitelabel/{dao}` prefix,
// so links built here must leave it out too.
const getProfilePath = async (daoId: DaoIdEnum, address: string) => {
  const isOnDaoDomain =
    resolveWhitelabelDaoIdFromHeaders(await headers()) === daoId;
  const route = `${WHITELABEL_ROUTES.address}/${address}`;

  return isOnDaoDomain
    ? `/${route}`
    : `/whitelabel/${daoId.toLowerCase()}/${route}`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { daoId, address } = await params;
  const daoIdEnum = toDaoIdEnum(daoId);
  const resolved = await resolveProfileAddressParam(address);

  if (!daoIdEnum || resolved.kind === "invalid") return {};

  return buildAddressProfileMetadata({
    daoId: daoIdEnum,
    address: resolved.address,
    canonicalPath: await getProfilePath(daoIdEnum, resolved.address),
    withSiteName: false,
  });
}

export default async function WhitelabelAddressProfilePage({ params }: Props) {
  const { daoId, address } = await params;
  const daoIdEnum = toDaoIdEnum(daoId);

  if (!daoIdEnum) notFound();

  const resolved = await resolveProfileAddressParam(address);

  if (resolved.kind === "invalid") notFound();

  if (resolved.kind === "ens") {
    permanentRedirect(await getProfilePath(daoIdEnum, resolved.address));
  }

  return <AddressProfile daoId={daoIdEnum} address={resolved.address} />;
}
