import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },
    type: { 
      type: String, 
      enum: ["topup", "withdraw", "donate_out", "donate_in", "refund"], 
      required: true 
    },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, default: 0 },
    balanceAfter: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ["pending", "completed", "failed"], 
      default: "completed" 
    },
    meta: {
      vnpayTxnRef: { type: String },
      donateId: { type: mongoose.Schema.Types.ObjectId, ref: "Donate" },
      senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      receiverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      note: String,
    },
  },
  { timestamps: true }
);

// ✅ Tạo unique index để tránh trùng transaction VNPay
walletTransactionSchema.index(
  { "meta.vnpayTxnRef": 1 }, 
  { unique: true, sparse: true }
);

walletTransactionSchema.index({ createdAt: -1 });

export default mongoose.model("WalletTransaction", walletTransactionSchema);
