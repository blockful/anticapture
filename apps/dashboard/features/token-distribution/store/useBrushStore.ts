import { create } from "zustand";
import { ChartDataSetPoint } from "@/shared/dao-config/types";

interface BrushState {
  visibleData: ChartDataSetPoint[];
  setVisibleData: (data: ChartDataSetPoint[]) => void;
  initializeData: (data: ChartDataSetPoint[]) => void;
}

export const useBrushStore = create<BrushState>((set, get) => ({
  visibleData: [],

  setVisibleData: (data: ChartDataSetPoint[]) => {
    set({ visibleData: data });
  },

  initializeData: (data: ChartDataSetPoint[]) => {
    // Only initialize if visibleData is empty or when new chart data loads
    const currentData = get().visibleData;
    if (currentData.length === 0 || data.length !== currentData.length) {
      set({ visibleData: data });
    }
  },
}));
