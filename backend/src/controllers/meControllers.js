import User from "../models/User.js";

export async function getMe(req, res) {
  try {
    const u = await User.findById(req.user._id).select(
      "username displayName email avatarUrl dPointAvailable dPointLocked bankAccount role isBanned"
    );
    if (!u) return res.status(401).json({ message: "Unauthorized" });

    return res.json({
      _id: u._id,
      username: u.username,
      displayName: u.displayName || "",
      email: u.email || "",
      avatarUrl: u.avatarUrl || "",

      role: u.role || "user",
      isBanned: !!u.isBanned,

      dPointAvailable: u.dPointAvailable || 0,
      dPointLocked: u.dPointLocked || 0,

      bankAccount: {
        bankName: u.bankAccount?.bankName || "",
        accountHolder: u.bankAccount?.accountHolder || "",
        branch: u.bankAccount?.branch || "",
        accountNumberMasked: (u.bankAccount?.accountNumber || "").replace(/\d(?=\d{4})/g, "*"),
        updatedAt: u.bankAccount?.updatedAt || null,
      },
    });
  } catch (e) {
    console.error("getMe error", e);
    return res.status(500).json({ message: "Failed to get profile" });
  }
}
