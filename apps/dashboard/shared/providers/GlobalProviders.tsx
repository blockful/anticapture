"use client";

import { TooltipProvider } from "@radix-ui/react-tooltip";
import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

import { setClientConfig } from "@anticapture/client";

import { LoginProvider } from "@/shared/services/auth/LoginProvider";
import { wagmiConfig } from "@/shared/services/wallet/wallet";

const queryClient = new QueryClient();

export const GlobalProviders = ({
  children,
  isWhitelabel = false,
}: {
  children: ReactNode;
  isWhitelabel?: boolean;
}) => {
  setClientConfig({
    defaultHeaders: {
      "x-client-source": isWhitelabel
        ? "anticapture-whitelabel"
        : "anticapture-dashboard",
    },
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RainbowKitProvider
            theme={lightTheme({
              accentColor: "#E66AE9",
            })}
          >
            <LoginProvider isWhitelabel={isWhitelabel}>
              <NuqsAdapter>{children}</NuqsAdapter>
            </LoginProvider>
          </RainbowKitProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
