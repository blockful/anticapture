import { redirect } from "next/navigation";

type WhitelabelIndexPageProps = {
  params: Promise<{
    daoId: string;
  }>;
};

export default async function WhitelabelIndexPage({
  params,
}: WhitelabelIndexPageProps) {
  const { daoId } = await params;

  redirect(`/whitelabel/${daoId}/proposals`);
}
