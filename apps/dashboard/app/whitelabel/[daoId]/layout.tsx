import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";

import NotFound from "@/app/not-found";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoApolloProvider } from "@/shared/providers/DaoApolloProvider";
import { DaoIdProvider } from "@/shared/providers/DaoIdProvider";
import { WhitelabelThemeInjector } from "@/shared/components/WhitelabelThemeInjector";
import { toDaoIdEnum } from "@/shared/types/daos";
import { getThemeCSSVariables } from "@/shared/utils/theme";
import { isWhitelabelDao } from "@/shared/utils/whitelabel";
import { WhitelabelShell } from "@/widgets/WhitelabelShell";

type WhitelabelLayoutProps = {
  children: ReactNode;
  params: Promise<{ daoId: string }>;
};

const isWhitelabelInternalRouteAllowed = () =>
  process.env.VERCEL_ENV !== "production";

export async function generateMetadata({
  params,
}: WhitelabelLayoutProps): Promise<Metadata> {
  if (!isWhitelabelInternalRouteAllowed()) {
    return {};
  }

  const { daoId } = await params;
  const daoIdEnum = toDaoIdEnum(daoId);

  if (!daoIdEnum) {
    return {};
  }

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
  if (!isWhitelabelInternalRouteAllowed()) {
    return <NotFound />;
  }

  const { daoId } = await params;
  const daoIdEnum = toDaoIdEnum(daoId);

  if (!daoIdEnum) {
    return <NotFound />;
  }

  const daoConfig = daoConfigByDaoId[daoIdEnum];

  if (!isWhitelabelDao(daoConfig)) {
    return <NotFound />;
  }

  const themeVariables = getThemeCSSVariables(daoIdEnum);

  return (
    <DaoIdProvider daoId={daoIdEnum}>
      <DaoApolloProvider daoId={daoIdEnum}>
        <WhitelabelThemeInjector variables={themeVariables} />
        <div style={themeVariables as CSSProperties}>
          <WhitelabelShell daoId={daoIdEnum}>{children}</WhitelabelShell>
        </div>
      </DaoApolloProvider>
    </DaoIdProvider>
  );
}
