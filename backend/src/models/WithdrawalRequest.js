import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    //  rút tiền của user hay của dự án
    kind: {
      type: String,
      enum: ["user", "campaign"],
      default: "user",
      index: true,
    },

    //  chỉ dùng khi kind="campaign"
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null, index: true },
    campaignSlug: { type: String, default: "" },

    amount: { type: Number, required: true, min: 50000 },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
      index: true,
    },

    bankName: String,
    accountNumber: String,
    accountHolder: String,

    adminNote: String,
    processedAt: Date,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

withdrawalRequestSchema.index({ createdAt: -1 });

export default mongoose.model("WithdrawalRequest", withdrawalRequestSchema);