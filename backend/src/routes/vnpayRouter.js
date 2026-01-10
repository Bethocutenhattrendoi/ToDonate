import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { createPaymentUrl, vnpayReturn } from "../controllers/vnpayController.js";

const router = express.Router();

// POST /api/vnpay/create - Tạo URL thanh toán (cần đăng nhập)
router.post("/create", requireAuth, createPaymentUrl);

// GET /api/vnpay/return - VNPay redirect về sau khi thanh toán
router.get("/return", vnpayReturn);

export default router;
