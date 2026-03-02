import { create } from "zustand";
import { supabase } from "../utils/supabase";

type KycState = {
  status: "unverified" | "in_progress" | "pending" | "verified" | "failed";
  setStatus: (status: KycState["status"]) => void;
  fetchStatus: () => Promise<void>;
};

export const useKycStore = create<KycState>((set) => ({
  status: "unverified",

  setStatus: (status) => set({ status }),

  fetchStatus: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("kyc_status")
      .select("status")
      .eq("id", user.id)
      .single();

    if (data) set({ status: data.status });
  },
}));