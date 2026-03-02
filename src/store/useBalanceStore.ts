import { create } from "zustand";
import { api } from "../utils/api";

interface BalanceState {
  fiat: number;
  usdc: number;
  isLoading: boolean;
  error: string | null;
  fetchBalances: () => Promise<void>;
}

// Ensure this is a named export (export const)
export const useBalanceStore = create<BalanceState>((set) => ({
  fiat: 0,
  usdc: 0,
  isLoading: false,
  error: null,

  fetchBalances: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api("/balance");
      
      set({
        fiat: data.fiat || 0,
        usdc: data.usdc || 0,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch balances",
        isLoading: false,
      });
    }
  },
}));