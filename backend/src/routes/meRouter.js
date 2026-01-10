import express from "express";
import { getMe } from "../controllers/meControllers.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// GET /api/me
router.get("/me", requireAuth, getMe);

export default router;
