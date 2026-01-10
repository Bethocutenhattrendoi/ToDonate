import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { topup, requestWithdraw, getTransactionHistory } from "../controllers/walletControllers.js";

const router = express.Router();
router.post("/topup", requireAuth, topup);
router.post("/withdraw", requireAuth, requestWithdraw);

// GET /api/wallet/transactions - Lấy lịch sử giao dịch
router.get("/transactions", requireAuth, getTransactionHistory);

export default router;
