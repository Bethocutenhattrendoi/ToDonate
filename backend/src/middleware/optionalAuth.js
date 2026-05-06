import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function optionalAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token =
      (auth.startsWith("Bearer ") ? auth.slice(7) : null) ||
      req.cookies?.access_token ||
      req.cookies?.token; // fallback nếu trước đó bạn từng dùng "token"

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded?.uid || decoded?.userId || decoded?.id;

      if (userId) {
        const user = await User.findById(userId).select(
          "_id username displayName email avatarUrl role isBanned"
        );

        if (user?.isBanned) {
          // optionalAuth: chỉ cần clear cookie và coi như chưa đăng nhập
          res.clearCookie("access_token", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
          });
        } else if (user) {
          req.user = user;
        }
      }
    }
  } catch (err) {
    // ignore: user không đăng nhập hoặc token lỗi
  }
  next();
}
