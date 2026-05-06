import mongoose from "mongoose";

const donateSchema = new mongoose.Schema(
  {
    receiverUsername: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Người gửi
    senderUserId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true,
    },
    senderUsername: {
      type: String,
      default: "",
    },

    // Người nhận
    receiverUserId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      index: true,
      // Bỏ required vì trong createDonation chưa set field này
    },

    // Optional: campaign / box
    title: { type: String, default: "", trim: true },

    // Display name của sender (giữ lại cho history)
    name: { type: String, required: true, trim: true },


    // Thông tin campaign liên quan (nếu có)
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },
    campaignSlug: { type: String },

    amount: { type: Number, required: true, min: 1000 },

    message: { type: String, default: "", trim: true, maxlength: 500 },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
    },
  },
  { timestamps: true }
);

// Index cho query
donateSchema.index({ createdAt: -1 });
donateSchema.index({ senderUserId: 1, createdAt: -1 });
donateSchema.index({ receiverUserId: 1, createdAt: -1 });

export default mongoose.model("Donate", donateSchema);