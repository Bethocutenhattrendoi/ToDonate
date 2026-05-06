import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, unique: true, sparse: true },
    googleId: { type: String, index: true },
    displayName: { type: String, default: "", trim: true },
    avatarUrl: { type: String, default: "", trim: true },
    coverUrl: { type: String, default: "", trim: true },
    isVerified: { type: Boolean, default: false },

    // User role and ban status
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBanned: { type: Boolean, default: false },

    // Funds available for spending
    dPointAvailable: { type: Number, default: 0, min: 0 },
    // Funds locked (e.g. pending withdrawal)
    dPointLocked: { type: Number, default: 0, min: 0 },

    bankAccount: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" }, // MVP: store plain; encrypt in production (AES/GCM)
      accountHolder: { type: String, default: "" },
      branch: { type: String, default: "" },
      updatedAt: { type: Date },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Convenience getter for total balance (available + locked)
userSchema.virtual("dPointTotal").get(function () {
  return (this.dPointAvailable || 0) + (this.dPointLocked || 0);
});

export default mongoose.model("User", userSchema);
