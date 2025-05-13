"use client";

import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";

import "@rainbow-me/rainbowkit/styles.css";

import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wallet";
import { TooltipProvider } from "@/shared/components/ui/tooltip";

const queryClient = new QueryClient();

export const GlobalProviders = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <RainbowKitProvider
            theme={lightTheme({
              accentColor: "#E66AE9",
            })}
          >
            {children}
          </RainbowKitProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
