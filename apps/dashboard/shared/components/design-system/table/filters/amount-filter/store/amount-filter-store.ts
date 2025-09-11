import { create } from "zustand";

export interface AmountFilterState {
  minAmount: string;
  maxAmount: string;
  sortOrder: string;
}

interface AmountFilterStore {
  // Estados
  minAmount: string;
  maxAmount: string;
  sortOrder: string;

  // Ações
  setMinAmount: (amount: string) => void;
  setMaxAmount: (amount: string) => void;
  setSortOrder: (order: string) => void;
  reset: (defaultSortOrder?: string) => void;
  initialize: (defaultSortOrder: string) => void;
  getState: () => AmountFilterState;
}

export const useAmountFilterStore = create<AmountFilterStore>((set, get) => ({
  // Estados iniciais
  minAmount: "",
  maxAmount: "",
  sortOrder: "",

  // Ações
  setMinAmount: (amount: string) => set({ minAmount: amount }),
  setMaxAmount: (amount: string) => set({ maxAmount: amount }),
  setSortOrder: (order: string) => set({ sortOrder: order }),

  reset: (defaultSortOrder = "") =>
    set({
      minAmount: "",
      maxAmount: "",
      sortOrder: defaultSortOrder,
    }),

  initialize: (defaultSortOrder: string) =>
    set({
      sortOrder: defaultSortOrder,
    }),

  getState: () => ({
    minAmount: get().minAmount,
    maxAmount: get().maxAmount,
    sortOrder: get().sortOrder,
  }),
}));
