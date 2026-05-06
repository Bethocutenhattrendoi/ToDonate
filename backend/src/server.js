import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import donationsRouter from "./routes/donationsRouter.js";
import authRouter from "./routes/authRouter.js";
import meRouter from "./routes/meRouter.js";
import profileRouter from "./routes/profileRouter.js";
import walletRoutes from "./routes/walletRoutes.js";
import vnpayRouter from "./routes/vnpayRouter.js";
import exploreRouter from "./routes/exploreRouter.js";
import campaignRouter from "./routes/campaignRouter.js";
import adminRouter from "./routes/adminRouter.js";

dotenv.config();

const app = express();

app.use(cors({ 
  origin: "http://localhost:5173", //  URL cụ thể, không dùng true
  credentials: true 
}));
app.use(cookieParser()); // Thêm để đọc cookies
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api", meRouter);
app.use("/api/profile", profileRouter);
app.use("/api/wallet", walletRoutes);
app.use("/api/donations", donationsRouter);
app.use("/api/vnpay", vnpayRouter);
app.use("/api/explore", exploreRouter);
app.use("/api/admin", adminRouter);
app.use("/api/campaigns", campaignRouter);

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGOOSEDB_CONNECT_STRING;

async function start() {
  try {
    if (!MONGO_URI) {
      console.error("Missing MONGO_URI in .env");
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
    process.exit(1);
  }
}

start();
