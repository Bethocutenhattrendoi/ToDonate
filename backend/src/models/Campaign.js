
import mongoose from "mongoose";

const CAMPAIGN_CATEGORIES = [
  "Trẻ em",
  "Cộng đồng",
  "Động vật hoang dã",
  "Giáo dục",
  "Hoàn cảnh khó khăn",
  "Môi trường",
  "Người già neo đơn",
  "Thiên tai",
  "Y tế",
  "Khác",
];

const CampaignSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true }, // ví dụ: "mauthiennguyen"
  name: { type: String, required: true },
  coverUrl: String, // ảnh đại diện

  // ✅ thêm category
  category: { type: String, enum: CAMPAIGN_CATEGORIES, default: "Khác", index: true },

  // ✅ thêm shortDescription nếu đang dùng ở controller
  shortDescription: { type: String, default: "" },

  description: String,
  ownerOrg: String, // đơn vị/cá nhân phát động
  goal: { type: Number, required: true },
  raised: { type: Number, default: 0 }, // tổng DPoint đã quyên góp
  receiverUsername: { type: String, required: true },
  status: { type: String, enum: ['active', 'ended', 'pending'], default: 'active' },
  balanceAvailable: { type: Number, default: 0 }, 
  balanceLocked: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Campaign", CampaignSchema);