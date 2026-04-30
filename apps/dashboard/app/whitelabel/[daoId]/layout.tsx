import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

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

  const title = `${daoConfig.name} Governance`;
  const description = `Browse proposals, delegates, and voting activity, review governance parameters, and monitor security metrics across the ${daoConfig.name} DAO.`;

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function WhitelabelLayout({
  children,
  params,
}: WhitelabelLayoutProps) {
  if (!isWhitelabelInternalRouteAllowed()) {
    notFound();
  }

  const { daoId } = await params;
  const daoIdEnum = toDaoIdEnum(daoId);

  if (!daoIdEnum) {
    notFound();
  }

  const daoConfig = daoConfigByDaoId[daoIdEnum];

  if (!isWhitelabelDao(daoConfig)) {
    notFound();
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
