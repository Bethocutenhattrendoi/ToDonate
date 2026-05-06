// src/controllers/adminController.js
import mongoose from "mongoose";
import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import CampaignWithdrawalRequest from "../models/CampaignWithdrawalRequest.js";
import WalletTransaction from "../models/WalletTransaction.js";
import WithdrawalRequest from "../models/WithdrawalRequest.js";

/**
 * A) CAMPAIGN WITHDRAWALS
 * kind="campaign"
 */
export async function adminListCampaignWithdrawals(req, res) {
  try {
    const { status = "pending", limit = 50 } = req.query;

    const rows = await CampaignWithdrawalRequest.find({ status })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    return res.json({ withdrawals: rows });
  } catch (e) {
    return res.status(500).json({ message: "List campaign withdrawals failed", error: e.message });
  }
}

export async function adminApproveCampaignWithdraw(req, res) {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    let out = null;

    await session.withTransaction(async () => {
      const wr = await CampaignWithdrawalRequest.findById(id).session(session);
      if (!wr) throw new Error("Withdrawal request not found");
      if (wr.status !== "pending") throw new Error("Request is not pending");

      const campaign = await Campaign.findById(wr.campaignId).session(session);
      if (!campaign) throw new Error("Campaign not found");

      const owner = await User.findById(wr.ownerUserId).session(session);
      if (!owner) throw new Error("Owner user not found");

      const amount = Number(wr.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid amount");

      // 1) Trừ tiền LOCKED của campaign
      const lockedBefore = Number(campaign.balanceLocked || 0);
      if (lockedBefore < amount) throw new Error("Campaign locked balance not enough");
      campaign.balanceLocked = lockedBefore - amount;
      await campaign.save({ session });

      // 2) Cộng tiền vào ví DPoint của owner
      const ownerAvailBefore = Number(owner.dPointAvailable || 0);
      owner.dPointAvailable = ownerAvailBefore + amount;
      await owner.save({ session });

      // 3) Tạo lịch sử giao dịch cho owner (type=topup hợp lệ)
      const projectName = (campaign.name || campaign.title || campaign.slug || "Dự án").toString();
      await WalletTransaction.create(
        [
          {
            userId: owner._id,
            type: "topup",
            amount,
            balanceBefore: ownerAvailBefore,
            balanceAfter: owner.dPointAvailable,
            status: "completed",
            meta: { note: `Nhận tiền rút từ dự án: ${projectName}` },
          },
        ],
        { session }
      );

      // 4) Update trạng thái withdrawal request (đúng field theo schema)
      wr.status = "completed";
      wr.handledAt = new Date();
      wr.handledByAdminId = req.admin?._id;
      await wr.save({ session });

      out = { ok: true, message: "Đã duyệt rút tiền dự án và cộng vào ví owner" };
    });

    return res.json(out);
  } catch (e) {
    return res.status(400).json({ message: "Approve campaign withdraw failed", error: e.message });
  } finally {
    session.endSession();
  }
}


export async function adminRejectCampaignWithdraw(req, res) {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    let out = null;

    await session.withTransaction(async () => {
      const wr = await CampaignWithdrawalRequest.findById(id).session(session);
      if (!wr) throw new Error("Withdrawal request not found");
      if (wr.status !== "pending") throw new Error("Request is not pending");

      const campaign = await Campaign.findById(wr.campaignId).session(session);
      if (!campaign) throw new Error("Campaign not found");

      const amount = Number(wr.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid amount");

      const lockedBefore = Number(campaign.balanceLocked || 0);
      const availBefore = Number(campaign.balanceAvailable || 0);

      campaign.balanceLocked = Math.max(0, lockedBefore - amount);
      campaign.balanceAvailable = availBefore + amount;
      await campaign.save({ session });

      //  schema không có "rejected" -> dùng "failed"
      wr.status = "failed";
      wr.handledAt = new Date();
      wr.handledByAdminId = req.admin?._id;
      await wr.save({ session });

      out = { ok: true, message: "Đã từ chối rút tiền dự án + trả lại balanceAvailable" };
    });

    return res.json(out);
  } catch (e) {
    return res.status(400).json({ message: "Reject campaign withdraw failed", error: e.message });
  } finally {
    session.endSession();
  }
}

/**
 * B) USER WITHDRAWALS
 * kind="user"
 */
export async function adminListUserWithdrawals(req, res) {
  try {
    const { status = "pending", limit = 50 } = req.query;

    const rows = await WithdrawalRequest.find({ kind: "user", status })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    const FEE_RATE = 0.05;

    const withdrawals = (rows || []).map((w) => {
      const amount = Number(w.amount || 0);

      const fee =
        typeof w.fee === "number" ? w.fee : Math.floor(amount * FEE_RATE);

      const receivedAmount =
        typeof w.receivedAmount === "number"
          ? w.receivedAmount
          : Math.max(0, amount - fee);

      return {
        ...w,
        feeRate: typeof w.feeRate === "number" ? w.feeRate : FEE_RATE,
        fee,
        receivedAmount,
      };
    });

    return res.json({ withdrawals });
  } catch (e) {
    return res.status(500).json({ message: "List user withdrawals failed", error: e.message });
  }
}

export async function adminApproveUserWithdraw(req, res) {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    let out = null;

    await session.withTransaction(async () => {
      const wr = await WithdrawalRequest.findById(id).session(session);
      if (!wr) throw new Error("Withdrawal request not found");
      if (wr.kind !== "user") throw new Error("Not a user withdrawal");
      if (wr.status !== "pending") throw new Error("Withdrawal is not pending");

      const user = await User.findById(wr.userId).session(session);
      if (!user) throw new Error("User not found");

      const amount = Number(wr.amount || 0);
      const lockedBefore = Number(user.dPointLocked || 0);
      if (lockedBefore < amount) throw new Error("Locked balance not enough");

      user.dPointLocked = lockedBefore - amount;
      await user.save({ session });

      wr.status = "completed";
      wr.processedAt = new Date();
      wr.processedBy = req.admin?._id;
      await wr.save({ session });

      await WalletTransaction.updateMany(
        { userId: user._id, type: "withdraw", status: "pending", "meta.withdrawalRequestId": wr._id },
        { $set: { status: "completed", "meta.note": `Rút tiền đã duyệt về ${wr.bankName}` } },
        { session }
      );

      out = { ok: true, message: "Đã duyệt rút tiền (user)" };
    });

    return res.json(out);
  } catch (e) {
    return res.status(400).json({ message: "Approve user withdraw failed", error: e.message });
  } finally {
    session.endSession();
  }
}

export async function adminRejectUserWithdraw(req, res) {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    let out = null;

    await session.withTransaction(async () => {
      const wr = await WithdrawalRequest.findById(id).session(session);
      if (!wr) throw new Error("Withdrawal request not found");
      if (wr.kind !== "user") throw new Error("Not a user withdrawal");
      if (wr.status !== "pending") throw new Error("Withdrawal is not pending");

      const user = await User.findById(wr.userId).session(session);
      if (!user) throw new Error("User not found");

      const amount = Number(wr.amount || 0);

      const lockedBefore = Number(user.dPointLocked || 0);
      const availBefore = Number(user.dPointAvailable || 0);

      user.dPointLocked = Math.max(0, lockedBefore - amount);
      user.dPointAvailable = availBefore + amount;
      await user.save({ session });

      wr.status = "rejected";
      wr.processedAt = new Date();
      wr.processedBy = req.admin?._id;
      await wr.save({ session });

      await WalletTransaction.updateMany(
        { userId: user._id, type: "withdraw", status: "pending", "meta.withdrawalRequestId": wr._id },
        { $set: { status: "failed", "meta.note": `Rút tiền bị từ chối (${wr.bankName})` } },
        { session }
      );

      await WalletTransaction.create(
        [
          {
            userId: user._id,
            type: "refund",
            amount,
            balanceBefore: availBefore,
            balanceAfter: user.dPointAvailable,
            status: "completed",
            meta: { note: `Hoàn tiền do rút bị từ chối (${wr.bankName})` },
          },
        ],
        { session }
      );

      out = { ok: true, message: "Đã từ chối rút + hoàn tiền (user)" };
    });

    return res.json(out);
  } catch (e) {
    return res.status(400).json({ message: "Reject user withdraw failed", error: e.message });
  } finally {
    session.endSession();
  }
}

/**
 * C) USERS
 */
export async function adminListUsers(req, res) {
  try {
    const { q = "", limit = 50 } = req.query;

    const filter = q
      ? { $or: [{ username: { $regex: q, $options: "i" } }, { name: { $regex: q, $options: "i" } }] }
      : {};

    const users = await User.find(filter)
      .select("_id username name role isBanned dPointAvailable dPointLocked createdAt")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    return res.json({ users });
  } catch (e) {
    return res.status(500).json({ message: "List users failed", error: e.message });
  }
}

export async function adminUpdateUser(req, res) {
  try {
    const { id } = req.params;
    const { role, isBanned } = req.body;

    const patch = {};
    if (role) patch.role = role;
    if (typeof isBanned === "boolean") patch.isBanned = isBanned;

    const user = await User.findByIdAndUpdate(id, patch, { new: true })
      .select("_id username name role isBanned dPointAvailable dPointLocked")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ ok: true, user });
  } catch (e) {
    return res.status(400).json({ message: "Update user failed", error: e.message });
  }
}
