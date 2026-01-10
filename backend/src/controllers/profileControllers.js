import User from "../models/User.js";

export async function upsertBankAccount(req, res) {
  try {
    const { bankName = "", accountNumber = "", accountHolder = "", branch = "" } = req.body;

    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      return res.status(400).json({ message: "Thiếu thông tin ngân hàng" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    user.bankAccount = {
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim(),
      branch: branch.trim(),
      updatedAt: new Date(),
    };
    await user.save();

    return res.json({ ok: true });
  } catch (e) {
    console.error("upsertBankAccount error", e);
    return res.status(500).json({ message: "Failed to upsert bank account" });
  }
}
