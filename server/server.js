import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import sessionRoutes from "./routes/sessionRoutes.js";
import balanceRoutes from "./routes/balance.js";
import notificationsRouter from "./routes/notifications.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/sessions", sessionRoutes);
app.use("/api/balance", balanceRoutes);
app.use("/notifications", notificationsRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "ShadowMint 2.0 backend is running" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ShadowMint 2.0 server running on port ${PORT}`);
});