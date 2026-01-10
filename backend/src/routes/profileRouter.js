import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { upsertBankAccount } from "../controllers/profileControllers.js";

const router = express.Router();

// POST /api/profile/bank
router.post("/bank", requireAuth, upsertBankAccount);

export default router;
