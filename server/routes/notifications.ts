import express from "express";

const router = express.Router();

router.post("/send", async (req, res) => {
  const { toUserId, title, message } = req.body;

  try {
    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        include_external_user_ids: [toUserId],
        headings: { en: title },
        contents: { en: message },
        channel_for_external_user_ids: "push",
      }),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send notification" });
  }
});

export default router;