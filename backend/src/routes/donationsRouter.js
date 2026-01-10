import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import {
  getDonations,
  getReceiver,
  createDonation,
  getSentDonations,
  getReceivedDonations,
  updateDonate,
  deleteDonate,
} from "../controllers/donateControllers.js";

const router = express.Router();

// Lấy danh sách donations (public)
router.get("/", optionalAuth, getDonations);

// Lấy thông tin người nhận (public)
router.get("/receiver/:username", optionalAuth, getReceiver);

// Lấy lịch sử donate đã gửi
router.get("/sent", requireAuth, getSentDonations);

// Lấy lịch sử donate đã nhận
router.get("/received", requireAuth, getReceivedDonations);

// Tạo donation mới (yêu cầu đăng nhập)
router.post("/", requireAuth, createDonation);

// Cập nhật donate
router.put("/:id", requireAuth, updateDonate);

// Xoá donate
router.delete("/:id", requireAuth, deleteDonate);

export default router;
