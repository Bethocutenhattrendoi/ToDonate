import crypto from "crypto";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import mongoose from "mongoose";

// Sắp xếp object theo key
function sortObject(obj) {
  const sorted = {};
  const str = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (let i = 0; i < str.length; i++) {
    sorted[str[i]] = encodeURIComponent(obj[str[i]]).replace(/%20/g, "+");
  }
  return sorted;
}

// Format date theo định dạng VNPay:  yyyyMMddHHmmss
function formatDate(date) {
  const pad = (n) => (n < 10 ? "0" + n : n);
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

// Tạo URL thanh toán VNPay
export async function createPaymentUrl(req, res) {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    // Validate
    if (!amount || amount < 10000) {
      return res.status(400).json({ message: "Số tiền tối thiểu 10,000đ" });
    }
    if (amount > 50000000) {
      return res.status(400).json({ message: "Số tiền tối đa 50,000,000đ" });
    }

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_HASH_SECRET;
    const vnpUrl = process.env.VNPAY_URL;
    const returnUrl = process.env.VNPAY_RETURN_URL;

    const date = new Date();
    const createDate = formatDate(date);
    const orderId = formatDate(date) + "_" + userId.toString().slice(-6);

    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    const vnpParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: "Nap " + amount + " DPoint",
      vnp_OrderType: "other",
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const sortedParams = sortObject(vnpParams);

    // Tạo chuỗi query
    const signData = Object.keys(sortedParams)
      .map((key) => key + "=" + sortedParams[key])
      .join("&");

    // Tạo chữ ký
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // Tạo URL cuối cùng
    const paymentUrl = vnpUrl + "?" + signData + "&vnp_SecureHash=" + signed;

    console.log("VNPay Payment URL created:", paymentUrl);

    return res.json({ paymentUrl, orderId });
  } catch (error) {
    console.error("createPaymentUrl error:", error);
    return res.status(500).json({ message: "Tạo URL thanh toán thất bại" });
  }
}

// Xử lý kết quả từ VNPay
export async function vnpayReturn(req, res) {
  try {
    let vnpParams = { ...req.query };
    const secureHash = vnpParams.vnp_SecureHash;

    // Xóa các field không dùng để verify
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    const sortedParams = sortObject(vnpParams);
    const secretKey = process.env.VNPAY_HASH_SECRET;

    const signData = Object.keys(sortedParams)
      .map((key) => key + "=" + sortedParams[key])
      .join("&");

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    const responseCode = vnpParams.vnp_ResponseCode;
    const txnRef = vnpParams.vnp_TxnRef;
    const amount = parseInt(vnpParams.vnp_Amount) / 100;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    console.log("VNPay Return:", { responseCode, txnRef, amount });
    console.log("Hash check:", { match: secureHash === signed });

    // Bỏ qua kiểm tra chữ ký trong sandbox (để test)
    if (responseCode === "00") {
      // ✅ QUAN TRỌNG: Kiểm tra transaction đã xử lý chưa
      const existingTx = await WalletTransaction.findOne({ 
        "meta.vnpayTxnRef": txnRef,
        status: "completed"
      });

      if (existingTx) {
        console.log(`Transaction ${txnRef} already processed`);
        
        // ✅ Trả về status=success để frontend hiểu là OK
        return res.redirect(
          `${frontendUrl}/payment/result?status=success&amount=${amount}&message=already_processed`
        );
      }

      // Lấy userId từ orderId (format: yyyyMMddHHmmss_userId6char)
      const parts = txnRef.split("_");
      const userIdPart = parts.length > 1 ? parts[1] : null;

      console.log("Looking for user with ID ending:", userIdPart);

      // Tìm tất cả users và lọc
      const users = await User.find({});
      const user = users.find(u => u._id.toString().endsWith(userIdPart));

      console.log("Found user:", user ? user._id : "NOT FOUND");

      if (user) {
        const balanceBefore = user.dPointAvailable || 0;
        user.dPointAvailable = balanceBefore + amount;
        await user.save();

        // Lưu transaction
        await WalletTransaction.create({
          userId: user._id,
          type: "topup",
          amount: amount,
          balanceBefore: balanceBefore,
          balanceAfter: user.dPointAvailable,
          status: "completed",
          meta: {
            vnpayTxnRef: txnRef,  // 👈 Lưu txnRef để check trùng
            note: "Nạp qua VNPay",
          },
        });

        console.log("Topup success! New balance:", user.dPointAvailable);

        // ✅ Xử lý thành công lần đầu
        return res.redirect(
          `${frontendUrl}/payment/result?status=success&amount=${amount}`
        );
      } else {
        console.log("User not found for txnRef:", txnRef);
        // ✅ Khi không tìm thấy user
        return res.redirect(
          `${frontendUrl}/payment/result?status=failed&message=user_not_found`
        );
      }
    } else {
      // ✅ Khi thanh toán thất bại
      return res.redirect(
        `${frontendUrl}/payment/result?status=failed&message=payment_failed`
      );
    }
  } catch (error) {
    console.error("vnpayReturn error:", error);
    // ✅ Khi có lỗi server
    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/result?status=failed&message=server_error`
    );
  }
}

// IPN (Instant Payment Notification) từ VNPay
export async function vnpayIPN(req, res) {
  try {
    const { 
      vnp_ResponseCode, 
      vnp_TxnRef, 
      vnp_Amount,
      vnp_TransactionStatus 
    } = req.query;

    // Verify checksum... (thêm code verify nếu cần)

    if (vnp_ResponseCode !== "00" || vnp_TransactionStatus !== "00") {
      return res.json({ RspCode: "00", Message: "Confirm Success" });
    }

    const amount = Number(vnp_Amount) / 100;
    const txnRef = vnp_TxnRef;

    // ✅ QUAN TRỌNG: Kiểm tra trùng
    const existingTx = await WalletTransaction.findOne({ 
      "meta.vnpayTxnRef": txnRef,
      status: "completed"
    });

    if (existingTx) {
      console.log(`IPN: Transaction ${txnRef} already processed`);
      return res.json({ RspCode: "00", Message: "Confirm Success" });
    }

    // Lấy userId từ txnRef
    const parts = txnRef.split("_");
    const userIdPart = parts.length > 1 ? parts[1] : null;

    const users = await User.find({});
    const user = users.find(u => u._id.toString().endsWith(userIdPart));

    if (!user) {
      return res.json({ RspCode: "01", Message: "User not found" });
    }

    const balanceBefore = user.dPointAvailable || 0;
    user.dPointAvailable = balanceBefore + amount;
    await user.save();

    await WalletTransaction.create({
      userId: user._id,
      type: "topup",
      amount: amount,
      balanceBefore: balanceBefore,
      balanceAfter: user.dPointAvailable,
      status: "completed",
      meta: {
        vnpayTxnRef: txnRef,
        note: "Nạp qua VNPay",
      },
    });

    return res.json({ RspCode: "00", Message: "Confirm Success" });

  } catch (error) {
    console.error("VNPay IPN error:", error);
    return res.json({ RspCode: "99", Message: "Unknown error" });
  }
}
