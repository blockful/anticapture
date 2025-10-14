import { create } from "zustand";
import { persist } from "zustand/middleware";
import { initialMetrics } from "@/features/token-distribution/utils/metrics";

export interface TokenDistributionState {
  metrics: string[];
  setMetrics: (metrics: string[]) => void;
}

export const useTokenDistributionStore = create<TokenDistributionState>()(
  persist(
    (set) => ({
      metrics: initialMetrics,
      setMetrics: (metrics: string[]) => {
        set({ metrics });
      },
    }),
    {
      name: "token-distribution-metrics",
    },
  ),
);
