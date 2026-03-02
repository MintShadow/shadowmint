import express from "express";
import {
  sendPayment,
  requestPayment,
  getActivity,
  getPaymentById
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/send", sendPayment);
router.post("/request", requestPayment);
router.get("/activity", getActivity);
router.get("/:id", getPaymentById);

export default router;
