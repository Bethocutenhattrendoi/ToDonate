import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

import {
  adminListCampaignWithdrawals,
  adminApproveCampaignWithdraw,
  adminRejectCampaignWithdraw,

  adminListUserWithdrawals,
  adminApproveUserWithdraw,
  adminRejectUserWithdraw,

  adminListUsers,
  adminUpdateUser,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

// campaign withdrawals (rút tiền dự án)
router.get("/withdrawals/campaigns", adminListCampaignWithdrawals);
router.post("/withdrawals/campaigns/:id/approve", adminApproveCampaignWithdraw);
router.post("/withdrawals/campaigns/:id/reject", adminRejectCampaignWithdraw);

// user withdrawals (rút tiền user)
router.get("/withdrawals/users", adminListUserWithdrawals);
router.post("/withdrawals/users/:id/approve", adminApproveUserWithdraw);
router.post("/withdrawals/users/:id/reject", adminRejectUserWithdraw);

// users
router.get("/users", adminListUsers);
router.patch("/users/:id", adminUpdateUser);

export default router;
