import express from "express";
import donateRouter from "./routes/donateRouter.js";
import authRouter from "./routes/authRouter.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

const PORT = process.env.PORT || 5001;
const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/donate", donateRouter);

connectDB()
  .then(() => {
    console.log("Kết nối đến cơ sở dữ liệu thành công");
    app.listen(PORT, () => console.log("Server bắt đầu chạy trên cổng", PORT));
  })
  .catch((error) => console.error("Lỗi kết nối đến cơ sở dữ liệu:", error));
