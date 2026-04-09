import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";

import daoConfigByDaoId from "@/shared/dao-config";
import { DaoApolloProvider } from "@/shared/providers/DaoApolloProvider";
import { WhitelabelThemeInjector } from "@/shared/components/WhitelabelThemeInjector";
import type { DaoIdEnum } from "@/shared/types/daos";
import { ALL_DAOS } from "@/shared/types/daos";
import { getThemeCSSVariables } from "@/shared/utils/theme";
import { isWhitelabelDao } from "@/shared/utils/whitelabel";
import { WhitelabelShell } from "@/widgets/WhitelabelShell";

type WhitelabelLayoutProps = {
  children: ReactNode;
  params: Promise<{ daoId: string }>;
};

export async function generateMetadata({
  params,
}: WhitelabelLayoutProps): Promise<Metadata> {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum];

  if (!daoConfig || !isWhitelabelDao(daoConfig)) {
    return {};
  }

  return {
    title: {
      default: `${daoConfig.name} Governance`,
      template: `%s | ${daoConfig.name} Governance`,
    },
    description: `Governance hub for ${daoConfig.name}.`,
  };
}

export default async function WhitelabelLayout({
  children,
  params,
}: WhitelabelLayoutProps) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;

  if (!ALL_DAOS.includes(daoIdEnum)) {
    notFound();
  }

  const daoConfig = daoConfigByDaoId[daoIdEnum];

  if (!isWhitelabelDao(daoConfig)) {
    notFound();
  }

  const themeVariables = getThemeCSSVariables(daoIdEnum);

  return (
    <DaoApolloProvider daoId={daoIdEnum}>
      <WhitelabelThemeInjector variables={themeVariables} />
      <div style={themeVariables as CSSProperties}>
        <WhitelabelShell daoId={daoIdEnum}>{children}</WhitelabelShell>
      </div>
    </DaoApolloProvider>
  );
}
