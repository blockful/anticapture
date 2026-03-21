import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { DaoApolloProvider } from "@/shared/providers/DaoApolloProvider";
import type { DaoIdEnum } from "@/shared/types/daos";
import { ALL_DAOS } from "@/shared/types/daos";

interface DaoRootLayoutProps {
  children: ReactNode;
  params: Promise<{ daoId: string }>;
}

export default async function DaoRootLayout({
  children,
  params,
}: DaoRootLayoutProps) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;

  if (!ALL_DAOS.includes(daoIdEnum)) {
    notFound();
  }

  return <DaoApolloProvider daoId={daoIdEnum}>{children}</DaoApolloProvider>;
}
