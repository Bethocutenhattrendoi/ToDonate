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
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
