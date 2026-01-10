import express from "express";
import { getCreators, getCreatorByUsername } from "../controllers/exploreController.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = express.Router();

// GET /api/explore/creators - Lấy danh sách creators
router.get("/creators", optionalAuth, getCreators);

// GET /api/explore/creator/:username - Lấy thông tin 1 creator
router.get("/creator/:username", getCreatorByUsername);

export default router;
