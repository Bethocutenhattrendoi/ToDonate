import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGOOSEDB_CONNECT_STRING;
    if (!uri) throw new Error("Missing MONGOOSEDB_CONNECT_STRING");

    await mongoose.connect(uri);
    console.log("✅ Liên kết cơ sở dữ liệu thành công");
  } catch (error) {
    console.error("❌ Lỗi khi liên kết cơ sở dữ liệu:", error.message);
    process.exit(1);
  }
};
