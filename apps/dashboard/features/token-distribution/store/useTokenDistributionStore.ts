import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TokenDistributionState {
  metrics: string[];
  setMetrics: (metrics: string[]) => void;
  hasTransfer: boolean;
  setHasTransfer: (hasTransfer: boolean) => void;
}

export const useTokenDistributionStore = create<TokenDistributionState>()(
  persist(
    (set) => ({
      metrics: [],
      setMetrics: (metrics: string[]) => {
        set({ metrics });
      },
      hasTransfer: true,
      setHasTransfer: (hasTransfer: boolean) => {
        set({ hasTransfer });
      },
    }),
    {
      name: "token-distribution-metrics",
    },
  ),
);
