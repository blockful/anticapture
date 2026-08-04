import { permanentRedirect } from "next/navigation";

type Props = {
  params: Promise<{ daoId: string }>;
};

export default async function WhitelabelHoldersAndDelegatesPage({
  params,
}: Props) {
  const { daoId } = await params;
  permanentRedirect(`/whitelabel/${daoId}/stakeholders`);
}
