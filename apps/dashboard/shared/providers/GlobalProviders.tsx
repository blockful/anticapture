"use client";

import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

import { wagmiConfig } from "@/shared/services/wallet/wallet";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";

const queryClient = new QueryClient();

// Apollo Client setup
export const apolloClient = new ApolloClient({
  uri: BACKEND_ENDPOINT,
  cache: new InMemoryCache(),
});

export const GlobalProviders = ({ children }: { children: ReactNode }) => {
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
