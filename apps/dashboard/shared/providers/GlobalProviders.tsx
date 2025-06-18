"use client";

import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";

import "@rainbow-me/rainbowkit/styles.css";

import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { wagmiConfig } from "@/shared/services/wallet/wallet";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";

const queryClient = new QueryClient();

// Apollo Client setup
const apolloClient = new ApolloClient({
  uri: BACKEND_ENDPOINT,
  cache: new InMemoryCache(),
});

export const GlobalProviders = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={apolloClient}>
          <TooltipProvider delayDuration={200}>
            <RainbowKitProvider
              theme={lightTheme({
                accentColor: "#E66AE9",
              })}
            >
              {children}
            </RainbowKitProvider>
          </TooltipProvider>
        </ApolloProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
