import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const createSession = async (req, res) => {
  const userId = req.user;
  const { device_name } = req.body;
  const ip = req.ip;

  const { data, error } = await supabase
    .from("shadowmint_sessions")
    .insert({
      user_id: userId,
      device_name,
      ip_address: ip
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error (req, res) => {
 });
  res.json(data);
};

export const getSessions = async req.user;

  const  const userId = { data, error }mint_sessions")
 = await supabase
    .from("shadow    .select("*")
    .eq("user_id", userId)
    .order("last_active", { ascending: false });

  if (error) return res.status(400).json({ error);
};

export const updateSession = });
  res.json(data async (req, res) => {
  const { session_id } = req.body;

  const { data, error } = await supabase
    .from("shadowmint_sessions")
    .update({ last_active: new Date() })
    .eq("id", session_id)
    .select()
    .error) return ressingle();

  if (.status(400).json.json(data);
};

export const delete({ error });
  resSession = async (req, res) => {
 
    .from("shadowmint_sessions")
 const { session_id } = req.body;

  const { error } = await supabase    .delete()
    .eq("id", session_id);

  if (error) return res.status(400).json({ error });
  res.json({ success: true });
};
