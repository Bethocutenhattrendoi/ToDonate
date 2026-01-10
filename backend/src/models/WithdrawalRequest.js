import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema. Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount:  {
      type:  Number,
      required: true,
      min: 50000,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default:  "pending",
    },
    bankName: String,
    accountNumber: String,
    accountHolder: String,
    adminNote: String,
    processedAt: Date,
    processedBy: {
      type: mongoose. Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

withdrawalRequestSchema.index({ createdAt: -1 });
withdrawalRequestSchema.index({ status: 1 });

export default mongoose.model("WithdrawalRequest", withdrawalRequestSchema);