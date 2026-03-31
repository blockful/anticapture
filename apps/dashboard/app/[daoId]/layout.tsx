import type { ReactNode } from "react";

import { DaoApolloProvider } from "@/shared/providers/DaoApolloProvider";
import type { DaoIdEnum } from "@/shared/types/daos";

interface DaoRootLayoutProps {
  children: ReactNode;
  params: Promise<{ daoId: string }>;
}

export default async function DaoRootLayout({
  children,
  params,
}: DaoRootLayoutProps) {
  const { daoId } = await params;

  return (
    <DaoApolloProvider daoId={daoId.toUpperCase() as DaoIdEnum}>
      {children}
    </DaoApolloProvider>
  );
}
