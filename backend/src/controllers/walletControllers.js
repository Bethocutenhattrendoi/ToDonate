import mongoose from "mongoose";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import WithdrawalRequest from "../models/WithdrawalRequest.js";

export async function topup(req, res) {
  const { amount = 0, note = "topup" } = req.body;
  const a = Number(amount);

  if (!Number.isFinite(a) || a <= 0) {
    return res.status(400).json({ message: "amount không hợp lệ" });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const before = user.dPointAvailable || 0;
    user.dPointAvailable = before + a;
    await user.save();

    await WalletTransaction.create({
      userId: user._id,
      type: "topup",
      amount: a,
      balanceBefore: before,
      balanceAfter: user.dPointAvailable,
      status: "completed",
      meta: { note },
    });

    return res.json({ balance: user.dPointAvailable });
  } catch (e) {
    console.error("Topup error", e);
    return res.status(500).json({ message: "Topup failed" });
  }
}

export async function requestWithdraw(req, res) {
  const amount = Number(req.body.amount || 0);
  
  if (!Number.isFinite(amount) || amount < 50000) {
    return res.status(400).json({ message: "Số tiền rút tối thiểu là 50.000 DPoint" });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Yêu cầu phải có tài khoản ngân hàng
    const ba = user.bankAccount || {};
    if (!ba.bankName || !ba.accountNumber || !ba.accountHolder) {
      return res.status(400).json({ message: "Bạn chưa nhập tài khoản ngân hàng" });
    }

    const available = user.dPointAvailable || 0;
    if (available < amount) {
      return res.status(400).json({ 
        message: "Không đủ DPoint để rút",
        available,
        required: amount
      });
    }

    // Lưu balance trước khi thay đổi
    const balanceBefore = available;

    // Khóa tiền: available -> locked
    user.dPointAvailable = available - amount;
    user.dPointLocked = (user.dPointLocked || 0) + amount;
    await user.save();

    // Tạo withdrawal request
    const wr = await WithdrawalRequest.create({
      userId: user._id,
      amount,
      status: "pending",
      bankName: ba.bankName,
      accountNumber: ba.accountNumber,
      accountHolder: ba.accountHolder,
    });

    // ✅ TẠO WALLET TRANSACTION ĐỂ HIỂN THỊ TRONG LỊCH SỬ
    await WalletTransaction.create({
      userId: user._id,
      type: "withdraw",
      amount: -amount,  // Số âm vì là trừ tiền
      balanceBefore: balanceBefore,
      balanceAfter: user.dPointAvailable,
      status: "pending",
      meta: {
        withdrawalRequestId: wr._id,
        bankName: ba.bankName,
        accountNumberMasked: ba.accountNumber.replace(/.(?=.{4})/g, '*'),
        accountHolder: ba.accountHolder,
        note: `Rút tiền về ${ba.bankName}`,
      },
    });

    return res.json({
      ok: true,
      message: "Yêu cầu rút tiền đã được gửi",
      request: wr,
      dPointAvailable: user.dPointAvailable,
      dPointLocked: user.dPointLocked,
    });
  } catch (e) {
    console.error("Withdraw request error:", e);
    return res.status(500).json({ message: "Rút tiền thất bại, vui lòng thử lại" });
  }
}

// Lấy lịch sử giao dịch
export async function getTransactionHistory(req, res) {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const transactions = await WalletTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await WalletTransaction.countDocuments({ userId });

    return res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getTransactionHistory error:", error);
    return res.status(500).json({ message: "Lỗi lấy lịch sử giao dịch" });
  }
}
