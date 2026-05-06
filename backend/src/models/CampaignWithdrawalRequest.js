import mongoose from "mongoose";

const campaignWithdrawalRequestSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    campaignSlug: { type: String, index: true },

    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerUsername: { type: String, index: true },

    amount: { type: Number, required: true },

    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountHolder: { type: String, required: true },

    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending", index: true },

    note: { type: String, default: "" },
    handledByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    handledAt: { type: Date },
  },
  { timestamps: true }
);

campaignWithdrawalRequestSchema.index({ createdAt: -1 });

export default mongoose.model("CampaignWithdrawalRequest", campaignWithdrawalRequestSchema);
