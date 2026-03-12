"use client";

import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import type { ReactNode } from "react";
import { useMemo, useRef } from "react";

import type { DaoIdEnum } from "@/shared/types/daos";
import { BACKEND_ENDPOINT, getAuthHeaders } from "@/shared/utils/server-utils";

function createDaoApolloClient() {
  return new ApolloClient({
    uri: BACKEND_ENDPOINT,
    cache: new InMemoryCache(),
    headers: getAuthHeaders(),
  });
}

export function DaoApolloProvider({
  daoId,
  children,
}: {
  daoId: DaoIdEnum;
  children: ReactNode;
}) {
  const clientsRef = useRef<Partial<Record<DaoIdEnum, ApolloClient<object>>>>(
    {},
  );

  const client = useMemo(() => {
    if (!clientsRef.current[daoId]) {
      clientsRef.current[daoId] = createDaoApolloClient();
    }
    return clientsRef.current[daoId];
  }, [daoId]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
