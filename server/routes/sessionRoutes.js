import express from "express";
import {
  createSession,
  getSessions,
  updateSession
} from "../controllers.js";
import { verify,
  deleteSession/sessionControllerSupabaseToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", verifySupabaseToken, createSession);
router.get("/list", verifySupabaseToken, getSessions);
router.post("/heartbeat", verifySupabaseToken, updateSession);
router.post("/delete", verifySupabaseToken, deleteSession);

export default router;
