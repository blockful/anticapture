import { create } from "zustand";
import { ChartDataSetPoint } from "@/shared/dao-config/types";

interface BrushState {
  visibleData: ChartDataSetPoint[];
  setVisibleData: (data: ChartDataSetPoint[]) => void;
}

export const useBrushStore = create<BrushState>((set) => ({
  visibleData: [],

  setVisibleData: (data: ChartDataSetPoint[]) => {
    set({ visibleData: data });
  },
}));
