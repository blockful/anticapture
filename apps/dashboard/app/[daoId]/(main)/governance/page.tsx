import type { Metadata } from "next";

import { GovernanceSection } from "@/features/governance";
import type { DaoIdEnum } from "@/shared/types/daos";

type Props = {
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  const canonicalPath = `/${params.daoId}/governance`;

  return {
    title: `${daoId} DAO Governance Proposals | Security Analysis — Anticapture`,
    description: `Browse and analyze governance proposals for ${daoId} DAO. Track voting patterns, delegate participation, and governance capture signals across on-chain proposals.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      title: `${daoId} DAO Governance Proposals | Security Analysis — Anticapture`,
      description: `Browse and analyze governance proposals for ${daoId} DAO. Track voting patterns, delegate participation, and governance capture signals across on-chain proposals.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${daoId} DAO Governance Proposals | Security Analysis — Anticapture`,
      description: `Browse and analyze governance proposals for ${daoId} DAO. Track voting patterns, delegate participation, and governance capture signals across on-chain proposals.`,
    },
  };
}

export default function GovernancePage() {
  return (
    <div>
      <GovernanceSection />
    </div>
  );
}
