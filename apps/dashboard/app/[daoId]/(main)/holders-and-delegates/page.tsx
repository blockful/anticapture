import { permanentRedirect } from "next/navigation";

type Props = {
  params: Promise<{ daoId: string }>;
};

export default async function LegacyHoldersAndDelegatesPage({ params }: Props) {
  const { daoId } = await params;
  permanentRedirect(`/${daoId}/stakeholders`);
}
