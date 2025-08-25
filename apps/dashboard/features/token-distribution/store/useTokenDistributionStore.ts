import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TokenDistributionState {
  metrics: string[];
  setMetrics: (metrics: string[]) => void;
}

export const useTokenDistributionStore = create<TokenDistributionState>()(
  persist(
    (set) => ({
      metrics: [],
      setMetrics: (metrics: string[]) => {
        set({ metrics });
      },
    }),
    {
      name: "token-distribution-metrics",
    },
  ),
);
