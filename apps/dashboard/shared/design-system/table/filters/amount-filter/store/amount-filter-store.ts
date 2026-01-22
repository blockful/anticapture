import { create } from "zustand";

export interface AmountFilterState {
  minAmount: string;
  maxAmount: string;
  sortOrder: string;
}

interface AmountFilterStore {
  instances: Record<string, AmountFilterState>;

  // Ações - todas agora recebem um filterId
  setMinAmount: (filterId: string, amount: string) => void;
  setMaxAmount: (filterId: string, amount: string) => void;
  setSortOrder: (filterId: string, order: string) => void;
  reset: (filterId: string, defaultSortOrder?: string) => void;
  initialize: (filterId: string, defaultSortOrder: string) => void;
  getState: (filterId: string) => AmountFilterState;
}

const defaultState: AmountFilterState = {
  minAmount: "",
  maxAmount: "",
  sortOrder: "",
};

export const useAmountFilterStore = create<AmountFilterStore>((set, get) => ({
  instances: {},

  getState: (filterId: string) => {
    const state = get().instances[filterId];
    return state || { ...defaultState };
  },

  setMinAmount: (filterId: string, amount: string) =>
    set((state) => ({
      instances: {
        ...state.instances,
        [filterId]: {
          ...(state.instances[filterId] || defaultState),
          minAmount: amount,
        },
      },
    })),

  setMaxAmount: (filterId: string, amount: string) =>
    set((state) => ({
      instances: {
        ...state.instances,
        [filterId]: {
          ...(state.instances[filterId] || defaultState),
          maxAmount: amount,
        },
      },
    })),

  setSortOrder: (filterId: string, order: string) =>
    set((state) => ({
      instances: {
        ...state.instances,
        [filterId]: {
          ...(state.instances[filterId] || defaultState),
          sortOrder: order,
        },
      },
    })),

  reset: (filterId: string, defaultSortOrder = "") =>
    set((state) => ({
      instances: {
        ...state.instances,
        [filterId]: {
          minAmount: "",
          maxAmount: "",
          sortOrder: defaultSortOrder,
        },
      },
    })),

  initialize: (filterId: string, defaultSortOrder: string) =>
    set((state) => {
      if (!state.instances[filterId]) {
        return {
          instances: {
            ...state.instances,
            [filterId]: {
              minAmount: "",
              maxAmount: "",
              sortOrder: defaultSortOrder,
            },
          },
        };
      }
      return state;
    }),
}));
