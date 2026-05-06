import mongoose from "mongoose";
import Campaign from "../models/Campaign.js";
import Donate from "../models/Donate.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import WithdrawalRequest from "../models/WithdrawalRequest.js";

import CampaignWithdrawalRequest from "../models/CampaignWithdrawalRequest.js";


// --- ĐÃ THAY THẾ THEO YÊU CẦU ---
export const ownerListCampaignWithdrawals = async (req, res) => {
  try {
    const { limit = 50, campaignSlug } = req.query;

    const q = { ownerUserId: req.user._id };
    if (campaignSlug) q.campaignSlug = String(campaignSlug);

    const withdrawals = await CampaignWithdrawalRequest.find(q)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    return res.json({ ok: true, withdrawals });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message || "Server error" });
  }
};

export const ownerRequestCampaignWithdraw = async (req, res) => {
  try {
    const { slug } = req.params;
    const amount = Number(req.body?.amount);

    if (!Number.isFinite(amount) || amount < 50000) {
      return res.status(400).json({ ok: false, message: "Rút tối thiểu 50.000 DPoint" });
    }

    const campaign = await Campaign.findOne({ slug });
    if (!campaign) return res.status(404).json({ ok: false, message: "Không tìm thấy dự án" });

    //  luôn lấy user từ DB để có bankAccount đầy đủ
    const userId = req.user?._id || req.user?.id;
    const userDoc = await User.findById(userId);
    if (!userDoc) return res.status(401).json({ ok: false, message: "Unauthorized" });

    //  check owner theo username
    const ownerUsername =
      campaign.receiverUsername ||
      campaign.creatorUsername ||
      campaign.ownerUsername ||
      campaign.createdByUsername ||
      campaign?.owner?.username ||
      "";

    if (!userDoc?.username || String(userDoc.username) !== String(ownerUsername)) {
      return res.status(403).json({ ok: false, message: "Bạn không có quyền rút dự án này" });
    }

    // check balance
    const available = Number(campaign.balanceAvailable || 0);
    if (amount > available) {
      return res.status(400).json({ ok: false, message: "Số dư dự án không đủ" });
    }

    //  check bank từ DB (không dùng req.user)
    const ba = userDoc.bankAccount || {};
    const hasAcc =
      !!ba.bankName &&
      !!ba.accountHolder &&
      (!!ba.accountNumber || !!ba.accountNumberMasked);

    if (!hasAcc) {
      return res.status(400).json({
        ok: false,
        message: "Bạn chưa nhập tài khoản ngân hàng (vào Profile > Ngân hàng để cập nhật)",
      });
    }

    // update campaign balance
    campaign.balanceAvailable = available - amount;
    campaign.balanceLocked = Number(campaign.balanceLocked || 0) + amount;
    await campaign.save();

    // create request
    const w = await CampaignWithdrawalRequest.create({
      kind: "campaign",
      campaignId: campaign._id,
      campaignSlug: campaign.slug,
      ownerUserId: userDoc._id,
      ownerUsername: userDoc.username,
      amount,
      bankName: ba.bankName,
      accountNumber: ba.accountNumber || ba.accountNumberMasked,
      accountHolder: ba.accountHolder,
      status: "pending",
    });

    return res.json({
      ok: true,
      message: "Đã tạo yêu cầu rút (chờ admin duyệt)",
      withdrawal: w,
      campaign: {
        balanceAvailable: campaign.balanceAvailable,
        balanceLocked: campaign.balanceLocked,
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message || "Server error" });
  }
};

// Tạo mới campaign (yêu cầu đăng nhập)
export async function createCampaign(req, res) {
  try {
    const receiverUsername = req.user?.username;
    if (!receiverUsername) return res.status(401).json({ message: "Unauthorized" });

    const goal = Number(req.body.goal);
    if (!goal || goal <= 0) return res.status(400).json({ message: "Thiếu hoặc sai mục tiêu" });

    const { name, slug, coverUrl, description, ownerOrg, status, category, shortDescription } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: "Thiếu tên hoặc slug" });
    }

    const existed = await Campaign.findOne({ slug });
    if (existed) {
      return res.status(400).json({ message: "Slug đã tồn tại" });
    }

    const campaign = await Campaign.create({
      name,
      slug,
      category,
      coverUrl,
      shortDescription,
      description,
      ownerOrg,
      status,
      goal,
      raised: 0,
      receiverUsername,
    });

    res.status(201).json({ campaign });
  } catch (e) {
    res.status(500).json({ message: "Có lỗi, không tạo được chiến dịch", error: e.message });
  }
}

// Lấy danh sách tất cả campaign (public)
export async function getAllCampaigns(req, res) {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (e) {
    res.json([]);
  }
}

// Lấy info campaign
export async function getCampaign(req, res) {
  try {
    const { slug } = req.params;
    const campaign = await Campaign.findOne({ slug });
    if (!campaign) return res.status(404).json({ message: "Không tìm thấy chiến dịch" });
    res.json(campaign);
  } catch (e) {
    res.status(500).json({ message: "Lỗi server" });
  }
}

// Lấy danh sách ủng hộ vào campaign
export async function getCampaignDonations(req, res) {
  try {
    const { campaignSlug, limit = 20 } = req.query;
    const campaign = await Campaign.findOne({ slug: campaignSlug });
    if (!campaign) return res.json({ donations: [] });

    // Nếu bạn muốn chỉ hiển thị donate đã duyệt thì dùng: { status: "success" }
    const donations = await Donate.find({ campaignId: campaign._id })
      .populate("senderUserId", "username displayName avatarUrl")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json({ donations });
  } catch (e) {
    res.json({ donations: [] });
  }
}

// Ủng hộ campaign (ADMIN-DUYỆT: receiver nhận vào dPointLocked + tạo 2 WalletTransaction)
export async function donateToCampaign(req, res) {
  const session = await mongoose.startSession();

  try {
    const { campaignSlug, amount, message = "", name } = req.body;
    const sender = req.user;

    if (!sender) return res.status(401).json({ message: "Vui lòng đăng nhập" });

    const money = Number(amount || 0);
    if (!Number.isFinite(money) || money < 1000) {
      return res.status(400).json({ message: "Số tiền tối thiểu 1.000 DPoint" });
    }

    const senderId = sender?._id || sender?.id;
    if (!senderId) return res.status(401).json({ message: "Vui lòng đăng nhập" });

    let resultPayload = null;

    await session.withTransaction(async () => {
      // 1) Campaign
      const campaign = await Campaign.findOne({ slug: campaignSlug }).session(session);
      if (!campaign) {
        throw new Error("Không tìm thấy chiến dịch");
      }

      if (!campaign.receiverUsername) {
        throw new Error("Chiến dịch thiếu receiverUsername");
      }

      // 2) Sender
      const senderDoc = await User.findById(senderId).session(session);
      if (!senderDoc) {
        throw new Error("Người dùng không tồn tại");
      }

      const senderBefore = Number(senderDoc.dPointAvailable || 0);
      if (senderBefore < money) {
        throw new Error("Số dư không đủ");
      }

      // 3) Receiver
      const receiverDoc = await User.findOne({ username: campaign.receiverUsername }).session(session);
      // receiverDoc optional for donate_in

      // 4) Trừ tiền sender
      senderDoc.dPointAvailable = senderBefore - money;
      await senderDoc.save({ session });

      // 5) Campaign raised + balanceAvailable
      campaign.raised = Number(campaign.raised || 0) + money;
      campaign.balanceAvailable = Number(campaign.balanceAvailable || 0) + money;
      await campaign.save({ session });

      // 6) Donate record: SUCCESS luôn
      const displayName = (name || senderDoc.displayName || senderDoc.username || "Ẩn danh").trim();

      const donate = await Donate.create(
        [
          {
            receiverUsername: campaign.receiverUsername,
            receiverUserId: receiverDoc?._id,
            title: campaign.name || "",
            campaignId: campaign._id,
            campaignSlug: campaign.slug,

            senderUserId: senderDoc._id,
            senderUsername: senderDoc.username,

            name: displayName,
            amount: money,
            message: message?.trim() || "",
            status: "success", // ADMIN-DUYỆT
          },
        ],
        { session }
      );

      // 7) WalletTransaction phía sender (donate_out)
      await WalletTransaction.create(
        [
          {
            userId: senderDoc._id,
            type: "donate_out",
            amount: -money,
            balanceBefore: senderBefore,
            balanceAfter: senderDoc.dPointAvailable,
            status: "completed",
            meta: {
              donateId: donate?.[0]?._id,
              campaignId: campaign._id,
              campaignSlug: campaign.slug,
              campaignName: campaign.name,
              receiverUsername: campaign.receiverUsername,
              note: `Donate tới dự án: ${campaign.name || campaign.slug}`,
            },
          },
        ],
        { session }
      );

      // (Tuỳ chọn) Nếu bạn muốn owner thấy “nhận donate” trong lịch sử cá nhân:
      // => tạo donate_in nhưng KHÔNG đổi balance user (chỉ để hiển thị)
      if (receiverDoc?._id) {
        const rb = Number(receiverDoc.dPointAvailable || 0);
        await WalletTransaction.create(
          [
            {
              userId: receiverDoc._id,
              type: "donate_in",
              amount: money,
              balanceBefore: rb,
              balanceAfter: rb,
              status: "completed",
              meta: {
                donateId: donate?.[0]?._id,
                campaignId: campaign._id,
                campaignSlug: campaign.slug,
                campaignName: campaign.name,
                senderUsername: senderDoc.username,
                note: `Nhận donate cho dự án: ${campaign.name || campaign.slug}`,
              },
            },
          ],
          { session }
        );
      }

      resultPayload = {
        ok: true,
        message: "Donate thành công!",
        donate: donate?.[0],
        dPointAvailable: senderDoc.dPointAvailable,
      };
    });

    return res.json(resultPayload);
  } catch (e) {
    const msg = e?.message || "Ủng hộ thất bại";
    return res.status(
      msg.includes("Không tìm thấy") || msg.includes("thiếu") || msg.includes("không đủ") ? 400 : 500
    ).json({ message: "Ủng hộ thất bại", error: msg });
  } finally {
    session.endSession();
  }
}
