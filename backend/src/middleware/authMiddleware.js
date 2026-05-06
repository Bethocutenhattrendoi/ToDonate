import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token =
      (auth.startsWith("Bearer ") ? auth.slice(7) : null) ||
      req.cookies?.access_token;

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.uid || decoded?.userId || decoded?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select(
      "_id username displayName email avatarUrl dPointAvailable dPointLocked role isBanned"
    );
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    if (user.isBanned) {
      res.clearCookie("access_token", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      return res.status(403).json({ message: "Tài khoản đã bị khóa (banned)." });
    }

    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

