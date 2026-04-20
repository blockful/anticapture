import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { DaoApolloProvider } from "@/shared/providers/DaoApolloProvider";
import { DaoIdProvider } from "@/shared/providers/DaoIdProvider";
import { toDaoIdEnum } from "@/shared/types/daos";

interface DaoRootLayoutProps {
  children: ReactNode;
  params: Promise<{ daoId: string }>;
}

export default async function DaoRootLayout({
  children,
  params,
}: DaoRootLayoutProps) {
  const { daoId } = await params;
  const daoIdEnum = toDaoIdEnum(daoId);

  if (!daoIdEnum) {
    notFound();
  }

  return (
    <DaoIdProvider daoId={daoIdEnum}>
      <DaoApolloProvider daoId={daoIdEnum}>{children}</DaoApolloProvider>
    </DaoIdProvider>
  );
}
