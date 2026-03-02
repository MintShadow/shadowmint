import supabase from "../utils/db.js";

const USER_ID = 1;

// Send money
export const sendPayment = async (req, res) => {
  const { amount, note, to_user } = req.body;

  const { data, error } = await supabase.from("payments").insert({
    amount,
    note,
    from_user: USER_ID,
    to_user
  }).select().single();

  if (error) return res.status(400).json({ error });

  res.json({ success: true, payment: data });
};

// Request money (stored as a payment row with a note tag)
export const requestPayment = async (req, res) => {
  const { amount, note, from_user } = req.body;

  const { data, error } = await supabase.from("payments").insert({
    amount,
    note: note || "REQUEST",
    from_user,
    to_user: USER_ID
  }).select().single();

  if (error) return res.status(400).json({ error });

  res.json({ success: true, request: data });
};

// Activity feed (all payments involving the user)
export const getActivity = async (req, res) => {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .or(`from_user.eq.${USER_ID},to_user.eq.${USER_ID}`)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error });

  res.json(data);
};

// Single payment
export const getPaymentById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(400).json({ error });

  res.json(data);
};
