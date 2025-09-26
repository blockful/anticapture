import { create } from "zustand";

interface BrushRange {
  startIndex: number;
  endIndex: number;
}

interface BrushState {
  brushRange: BrushRange;
  setBrushRange: (brushRange: BrushRange) => void;
}

export const useBrushStore = create<BrushState>((set) => ({
  brushRange: { startIndex: 0, endIndex: 0 },

  setBrushRange: (brushRange) => {
    set({ brushRange });
  },
}));
