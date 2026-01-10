import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    // Ignore error, user is not logged in
  }
  next();
}
