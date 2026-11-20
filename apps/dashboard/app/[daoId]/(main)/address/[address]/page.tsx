import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { AddressProfile } from "@/features/holders-and-delegates/profile/AddressProfile";
import { buildAddressProfileMetadata } from "@/features/holders-and-delegates/profile/utils/addressProfileMetadata";
import { resolveProfileAddressParam } from "@/features/holders-and-delegates/profile/utils/resolveProfileAddress";
import { toDaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string; address: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { daoId, address } = await params;
  const daoIdEnum = toDaoIdEnum(daoId);
  const resolved = await resolveProfileAddressParam(address);

  if (!daoIdEnum || resolved.kind === "invalid") return {};

  return buildAddressProfileMetadata({
    daoId: daoIdEnum,
    address: resolved.address,
    canonicalPath: `/${daoIdEnum.toLowerCase()}/address/${resolved.address}`,
    withSiteName: true,
  });
}

export default async function AddressProfilePage({ params }: Props) {
  const { daoId, address } = await params;
  const daoIdEnum = toDaoIdEnum(daoId);

  if (!daoIdEnum) notFound();

  const resolved = await resolveProfileAddressParam(address);

  if (resolved.kind === "invalid") notFound();

  // ENS names are a convenience for typing the URL; the 0x one is canonical.
  if (resolved.kind === "ens") {
    permanentRedirect(
      `/${daoIdEnum.toLowerCase()}/address/${resolved.address}`,
    );
  }

  return <AddressProfile daoId={daoIdEnum} address={resolved.address} />;
}
