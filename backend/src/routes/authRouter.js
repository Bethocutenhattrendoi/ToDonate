import express from "express";
import { googleLogin, me } from "../controllers/authControllers.js";

const router = express.Router();
router.post("/google", googleLogin);
router.get("/me", me);

export default router;
