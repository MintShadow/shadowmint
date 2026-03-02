import supabase from "../utils/db.js";

export const getPublicProfile = async (req, res) => {
  const { username } = req.params;

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, username, photo")
    .eq("username", username)
    .single();

  if (error || !user) return res.status(404).json({ error: "User not found" });

  // You can later add public stats, recent activity, etc.
  res.json({
    user,
    pay_link: `/pay/${user.username}`
  });
};
