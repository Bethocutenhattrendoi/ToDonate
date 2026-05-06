import User from "../models/User.js";

export async function requireAdmin(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("role isBanned username");
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    if (user.isBanned) {
      res.clearCookie("access_token", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      return res.status(403).json({ message: "User is banned" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    req.admin = user;
    next();
  } catch (e) {
    return res.status(500).json({ message: "Admin check failed", error: e.message });
  }
}
