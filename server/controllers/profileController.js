import supabase from "../utils/db.js";

// For now, assume user id = 1 (later: real auth)
const USER_ID = 1;

export const getProfile = async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", USER_ID)
    .single();

  if (error) return res.status(400).json({ error });

  res.json(data);
};

export const updateProfile = async (req, res) => {
  const updates = req.body;

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", USER_ID)
    .select()
    .single();

  if (error) return res.status(400).json({ error });

  res.json({ success: true, user: data });
};
