import { create } from "zustand";
import { supabase } from "../utils/supabase";

type Transaction = {
  id: number;
  type: string;
  amount: number;
  currency: string;
  from?: string;
  to?: string;
  date: string;
  status: string;
  notes?: string;
};

type TransactionState = {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
};

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      set({ transactions: data ?? [], loading: false });
    } catch (e: any) {
      set({
        error: e?.message || "Failed to load transactions",
        loading: false,
      });
    }
  },
}));