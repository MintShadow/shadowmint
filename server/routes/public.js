import express from "express";
import { getPublicProfile } from "../controllers/publicController.js";

const router = express.Router();

router.get("/:username", getPublicProfile);

export default router;
