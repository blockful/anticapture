"use client";

import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

import { wagmiConfig } from "@/shared/services/wallet/wallet";
import { BACKEND_ENDPOINT, getAuthHeaders } from "@/shared/utils/server-utils";

const queryClient = new QueryClient();

// Apollo Client setup
export const apolloClient = new ApolloClient({
  uri: BACKEND_ENDPOINT,
  cache: new InMemoryCache(),
  headers: getAuthHeaders(),
  queryDeduplication: false,
});

export const GlobalProviders = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const isWhitelabelRoute = pathname?.startsWith("/whitelabel/");

  useEffect(() => {
    const root = document.documentElement;

    if (isWhitelabelRoute) {
      root.classList.remove("dark");
      return;
    }

    root.classList.add("dark");
  }, [isWhitelabelRoute]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={apolloClient}>
          <TooltipProvider>
            <RainbowKitProvider
              theme={lightTheme({
                accentColor: "#E66AE9",
              })}
            >
              <NuqsAdapter>{children}</NuqsAdapter>
            </RainbowKitProvider>
          </TooltipProvider>
        </ApolloProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
