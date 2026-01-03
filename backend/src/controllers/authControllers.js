import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body; // ID token từ Google
    if (!credential) return res.status(400).json({ message: "Missing credential" });

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    // payload: sub, email, name, picture, email_verified...
    if (!payload?.email) return res.status(401).json({ message: "Invalid Google token" });

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || "";
    const picture = payload.picture || "";

    // username: bạn có thể tạo từ email (phần trước @) + suffix nếu trùng
    const baseUsername = (email.split("@")[0] || "user").toLowerCase();

    let user = await User.findOne({ email });
    if (!user) {
      // đảm bảo unique username
      let username = baseUsername;
      let i = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${i++}`;
      }

      user = await User.create({
        email,
        username,
        displayName: name || username,
        avatarUrl: picture,
        coverUrl: "",
        isVerified: true,
        googleId,
      });
    } else {
      // cập nhật avatar/name theo Google nếu muốn
      user.googleId = user.googleId || googleId;
      user.avatarUrl = user.avatarUrl || picture;
      user.displayName = user.displayName || name;
      await user.save();
    }

    const token = jwt.sign(
      { uid: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ khuyên dùng cookie httpOnly
    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // dev
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Google login failed" });
  }
};

export const me = async (req, res) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.uid).select("username displayName email avatarUrl coverUrl");
    if (!user) return res.status(401).json({ message: "User not found" });

    return res.json({ user });
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

