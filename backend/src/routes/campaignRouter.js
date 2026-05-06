import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import {
  getCampaign,
  getCampaignDonations,
  donateToCampaign,
  getAllCampaigns,
  createCampaign,
  ownerListCampaignWithdrawals,
  ownerRequestCampaignWithdraw,
} from "../controllers/campaignController.js";

const router = express.Router();

// Public: list campaigns
router.get("/", getAllCampaigns);

// Auth: create campaign
router.post("/", requireAuth, createCampaign);

// Public: donations list (PHẢI đặt trước /:slug)
router.get("/donations/list", getCampaignDonations);

// Auth: donate
router.post("/donate", requireAuth, donateToCampaign);

//  Owner: list withdrawals
router.get("/owner/withdrawals", requireAuth, ownerListCampaignWithdrawals);

//  Owner: request withdraw (by slug)
router.post("/:slug/withdraw", requireAuth, ownerRequestCampaignWithdraw);

// Public: campaign detail
router.get("/:slug", optionalAuth, getCampaign);

export default router;
