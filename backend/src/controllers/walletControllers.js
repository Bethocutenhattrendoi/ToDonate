import mongoose from "mongoose";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import WithdrawalRequest from "../models/WithdrawalRequest.js";
import Donate from "../models/Donate.js";

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

    //  TẠO WALLET TRANSACTION ĐỂ HIỂN THỊ TRONG LỊCH SỬ
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

// Lấy lịch sử giao dịch (gộp WalletTransaction + Donate)
export async function getTransactionHistory(req, res) {
  try {
    const userId = req.user._id;
    const username = req.user.username;
    const pageNum = Number(req.query.page || 1);
    const limitNum = Number(req.query.limit || 10);

    const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
    const limit = Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 10;

    // Mẹo phân trang kiểu "feed":
    // lấy nhiều hơn rồi merge-sort-slice để ra đúng page
    const need = page * limit;

    // 1) WalletTransaction
    const walletTxs = await WalletTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(need)
      .lean();

    const walletTotal = await WalletTransaction.countDocuments({ userId });

    // 2) Donate (donate_out + donate_in)
    const donateDocs = await Donate.find({
      status: "success",
      $or: [
        { senderUserId: userId },
        { receiverUserId: userId },
        { receiverUsername: username },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(need)
      .lean();

    const donateTotal = await Donate.countDocuments({
      status: "success",
      $or: [
        { senderUserId: userId },
        { receiverUserId: userId },
        { receiverUsername: username },
      ],
    });

    // Map Donate -> format giống WalletTransaction để FE dùng lại TransactionItem
    const donateTxs = donateDocs
      .map((d) => {
        const isSender = String(d.senderUserId) === String(userId);
        const isReceiver =
          String(d.receiverUserId || "") === String(userId) ||
          String(d.receiverUsername || "") === String(username || "");

        if (!isSender && !isReceiver) return null;


        // NOTE hiển thị rõ donate cho dự án nào + (tuỳ chọn) lời nhắn
        let note = "Donate";

        if (d.campaignSlug || d.campaignId || d.type === "campaign") {
          const projectName = (d.title || d.campaignSlug || "Chiến dịch").trim();
          note = `Ủng hộ dự án: ${projectName}`;
          if (d.message && String(d.message).trim()) {
            note += ` • "${String(d.message).trim()}"`;
          }
        } else {
          if (d.message && String(d.message).trim()) {
            note = `Donate: ${String(d.message).trim()}`;
          }
        }

        return {
          _id: `donate_${d._id}`,
          type: isSender ? "donate_out" : "donate_in",
          amount: Number(d.amount || 0),
          status: "completed",
          createdAt: d.createdAt,
          meta: { note, campaignSlug: d.campaignSlug || "" },
        };
      })
      .filter(Boolean);

    // 3) Merge + sort + slice đúng trang
    const merged = [...walletTxs, ...donateTxs].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const start = (page - 1) * limit;
    const sliced = merged.slice(start, start + limit);

    const total = walletTotal + donateTotal;

    return res.json({
      transactions: sliced,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getTransactionHistory error:", error);
    return res.status(500).json({ message: "Lỗi lấy lịch sử giao dịch" });
  }
}
