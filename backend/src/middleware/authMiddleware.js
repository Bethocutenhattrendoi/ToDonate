import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  try {
    console.log("Cookies:", req.cookies); // 👈 Debug
    console.log("Authorization:", req.headers.authorization); // 👈 Debug
    
    const auth = req.headers.authorization || "";
    const token = (auth.startsWith("Bearer ") ? auth.slice(7) : null) || req.cookies?.access_token;

    console.log("Token:", token); // 👈 Debug

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.uid || decoded?.userId || decoded?.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("_id username displayName email avatarUrl dPointAvailable dPointLocked");
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

