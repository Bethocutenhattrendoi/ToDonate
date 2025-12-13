import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(
            process.env.MONGOOSEDB_CONNECT_STRING,
        );
        console.log('Liên kết cơ sở dữ liệu thành công');
    } catch (error) {
        console.error('Lỗi khi liên kết cơ sở dữ liệu:', error);
        process.exit(1); // Thoát ứng dụng nếu không thể kết nối đến DB
    }
};
