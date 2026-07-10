import type { Metadata } from "next";

import { ApiKeysManager } from "@/features/api-keys";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;
  const canonicalPath = `/${params.daoId}/api-keys`;

  return {
    title: `${daoId} API Keys — Anticapture`,
    description:
      "Create and manage API keys to query Anticapture from Claude, Cursor, or Codex.",
    alternates: { canonical: canonicalPath },
    robots: { index: false, follow: false },
  };
}

export default function ApiKeysPage() {
  return <ApiKeysManager />;
}
