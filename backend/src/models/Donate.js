import mongoose from "mongoose";

const donateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true, // tự động tạo createdAt và updatedAt
  }
);

// Model
const Donate = mongoose.model("Donate", donateSchema);

export default Donate;