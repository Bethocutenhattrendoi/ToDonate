import mongoose from "mongoose";
import Donate from "../models/Donate.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

/**
 * Lấy danh sách donations
 * GET /api/donations?username=xxx
 */
export async function getDonations(req, res) {
  try {
    const { username, limit = 200 } = req.query;

    const q = {};
    if (username) q.receiverUsername = username;

    const items = await Donate.find(q)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 200, 500))
      .lean();

    return res.json(items);
  } catch (e) {
    console.error("getDonations error:", e);
    return res.status(500).json({ message: "Get donations failed" });
  }
}

/**
 * Lấy thông tin người nhận donate
 * GET /api/donations/receiver/:username
 */
export async function getReceiver(req, res) {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username })
      .select("username displayName avatarUrl bio dPointAvailable")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.json(user);
  } catch (error) {
    console.error("getReceiver error:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
}

/**
 * Tạo donation mới (KHÔNG dùng Transaction - tương thích MongoDB standalone)
 * POST /api/donations
 */
export async function createDonation(req, res) {
  const { receiverUsername, name, amount, message = "" } = req.body;

  const money = Number(amount || 0);
  
  // Validate
  if (!receiverUsername) {
    return res.status(400).json({ message: "Thiếu receiverUsername" });
  }
  if (!Number.isFinite(money) || money < 1000) {
    return res.status(400).json({ message: "Số tiền tối thiểu là 1.000 DPoint" });
  }
  if (money > 100000000) {
    return res.status(400).json({ message: "Số tiền tối đa là 100.000.000 DPoint" });
  }

  // Người gửi: user đang đăng nhập
  const sender = req.user;
  if (!sender) {
    return res.status(401).json({ message: "Vui lòng đăng nhập" });
  }

  try {
    // Lấy thông tin sender
    const senderDoc = await User.findById(sender._id);
    if (!senderDoc) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Tìm người nhận
    const receiverDoc = await User.findOne({ username: receiverUsername });
    if (!receiverDoc) {
      return res.status(404).json({ message: "Không tìm thấy người nhận" });
    }

    // Không cho donate chính mình
    if (String(senderDoc._id) === String(receiverDoc._id)) {
      return res.status(400).json({ message: "Không thể donate cho chính mình" });
    }

    // Kiểm tra số dư
    const available = Number(senderDoc.dPointAvailable || 0);
    if (available < money) {
      return res.status(400).json({ 
        message: "Số dư không đủ",
        available: available,
        required: money
      });
    }

    // Lưu balance trước khi thay đổi
    const senderBalanceBefore = available;
    const receiverBalanceBefore = Number(receiverDoc.dPointAvailable || 0);

    // Trừ DPoint người gửi
    senderDoc.dPointAvailable = available - money;
    await senderDoc.save();

    // Cộng DPoint người nhận
    receiverDoc.dPointAvailable = receiverBalanceBefore + money;
    await receiverDoc.save();

    // Tạo record donate
    const donate = await Donate.create({
      receiverUsername,
      receiverUserId: receiverDoc._id,
      senderUserId: senderDoc._id,
      senderUsername: senderDoc.username,
      name: (name || senderDoc.displayName || senderDoc.username || "Ẩn danh").trim(),
      amount: money,
      message: message?.trim() || "",
      status: "success",
    });

    // Log giao dịch ví - Người gửi
    await WalletTransaction.create({
      userId: senderDoc._id,
      type: "donate_out",
      amount: -money,
      balanceBefore: senderBalanceBefore,
      balanceAfter: senderDoc.dPointAvailable,
      status: "completed",
      meta: { 
        donateId: donate._id, 
        receiverUserId: receiverDoc._id,
        note: `Donate cho @${receiverUsername}` 
      },
    });

    // Log giao dịch ví - Người nhận
    await WalletTransaction.create({
      userId: receiverDoc._id,
      type: "donate_in",
      amount: money,
      balanceBefore: receiverBalanceBefore,
      balanceAfter: receiverDoc.dPointAvailable,
      status: "completed",
      meta: { 
        donateId: donate._id,
        senderUserId: senderDoc._id,
        note: `Nhận donate từ @${senderDoc.username}` 
      },
    });
    
    return res.json({ 
      ok: true, 
      message: "Donate thành công!",
      donate: donate, 
      dPointAvailable: senderDoc.dPointAvailable,
      receiver: {
        username: receiverDoc.username,
        displayName: receiverDoc.displayName,
        avatarUrl: receiverDoc.avatarUrl,
      }
    });

  } catch (e) {
    console.error("createDonation error:", e);
    return res.status(500).json({ message: "Donate thất bại, vui lòng thử lại", error: e.message });
  }
}

/**
 * Lấy lịch sử donate đã gửi
 * GET /api/donations/sent
 */
export async function getSentDonations(req, res) {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const donations = await Donate.find({ senderUserId: userId })
      .populate("receiverUserId", "username displayName avatarUrl")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Donate.countDocuments({ senderUserId: userId });

    return res.json({
      donations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getSentDonations error:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
}

/**
 * Lấy lịch sử donate đã nhận (PUBLIC: cho phép xem bất kỳ user nào theo username)
 * GET /api/donations/received?username=xxx
 */
export async function getReceivedDonations(req, res) {
  try {
    // Nếu truyền username thì show public, nếu không truy vấn user đang đăng nhập cũ (phục vụ frontend/my profile)
    const { username, page = 1, limit = 20 } = req.query;

    let receiverDoc;
    if (username) {
      receiverDoc = await User.findOne({ username });
      if (!receiverDoc) return res.json({ donations: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } });
    }

    // Nếu không truyền username nhưng có req.user (profile cá nhân)
    const receiverUserId = receiverDoc?._id || req.user?._id;
    if (!receiverUserId) return res.json({ donations: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } });

    const donations = await Donate.find({ receiverUserId })
      .populate("senderUserId", "username displayName avatarUrl")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Donate.countDocuments({ receiverUserId });

    return res.json({
      donations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("getReceivedDonations error:", error);
    return res.json({ donations: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } });
  }
}

// Cập nhật donate theo ID
export const updateDonate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    if (updateData.status && !["pending", "success", "failed"].includes(updateData.status)) {
      return res.status(400).json({ message: "Trường status không hợp lệ" });
    }

    const updatedDonate = await Donate.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedDonate) {
      return res.status(404).json({ message: "Không tìm thấy Donate" });
    }

    res.status(200).json({
      message: "Donate đã được cập nhật",
      donate: updatedDonate,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật Donate:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật Donate", error: error.message });
  }
};

// Xoá donate theo ID
export const deleteDonate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const deletedDonate = await Donate.findByIdAndDelete(id);

    if (!deletedDonate) {
      return res.status(404).json({ message: "Không tìm thấy Donate" });
    }

    res.status(200).json({
      message: "Donate đã được xoá",
      donate: deletedDonate,
    });
  } catch (error) {
    console.error("Lỗi khi xoá Donate:", error);
    res.status(500).json({ message: "Lỗi khi xoá Donate", error: error.message });
  }
}