import express from "express";
import donateRouter from "./routes/donateRouter.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5001;

const app = express();


app.use(express.json());

app.use("/api/donate", donateRouter);

connectDB().then(() => {
    console.log('Kết nối đến cơ sở dữ liệu thành công');
    app.listen(PORT, () => {
    console.log('Server bắt đầu chạy trên cổng', PORT);
});
}).catch((error) => {
    console.error('Lỗi kết nối đến cơ sở dữ liệu:', error);
});

