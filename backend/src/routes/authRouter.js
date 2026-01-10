import express from "express";
import { googleLogin, logout } from "../controllers/authControllers.js";
import { getMe } from "../controllers/meControllers.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { upsertBankAccount } from "../controllers/profileControllers.js";

const router = express.Router();

router.post("/google", googleLogin);
router.get("/me", requireAuth, getMe);
// support POST /api/auth/profile/bank for convenience
router.post("/profile/bank", requireAuth, upsertBankAccount);
router.post("/logout", logout);

export default router;
