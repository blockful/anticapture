"use client";

import React from "react";
import { WagmiProvider } from "wagmi";

import "@rainbow-me/rainbowkit/styles.css";

import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { DaoDataProvider } from "../contexts/dao-data-provider";
import { wagmiConfig } from "@/lib/wallet";
import { DaoName } from "@/lib/server/backend";

const queryClient = new QueryClient();

export const GlobalProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <DaoDataProvider daoName={DaoName.UNISWAP}>
          <RainbowKitProvider
            theme={lightTheme({
              accentColor: "#E66AE9",
            })}
          >
            {children}
          </RainbowKitProvider>
        </DaoDataProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
