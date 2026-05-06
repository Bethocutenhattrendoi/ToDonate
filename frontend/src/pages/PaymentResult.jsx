import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { fetchMe } from "@/lib/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

function formatVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0));
}

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lấy params từ URL
  const status = searchParams.get("status");
  const amount = searchParams.get("amount");
  const message = searchParams.get("message");
  
  // ✅ Lấy VNPay params
  const vnpResponseCode = searchParams.get("vnp_ResponseCode");
  const vnpAmount = searchParams.get("vnp_Amount");

  // ✅ Xác định thành công hay thất bại
  // - status=success -> thành công
  // - message=already_processed -> đã xử lý trước đó (vẫn OK)
  const isSuccess = status === "success" || message === "already_processed";
  const isAlreadyProcessed = message === "already_processed";

  // Tính số tiền (VNPay trả về x100)
  const displayAmount = amount || (vnpAmount ? Number(vnpAmount) / 100 : 0);

  // ✅ Load user data để lấy số dư mới
  useEffect(() => {
    async function run() {
      setLoading(true);
      try {
        // 1) gọi backend verify + cộng tiền
        await fetch(`${API_BASE}/api/vnpay/verify?${searchParams.toString()}`, {
          credentials: "include",
        });

        // 2) lấy lại số dư mới
        const user = await fetchMe();
        setMe(user);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    run();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#4D63FF] animate-spin" />
          <div className="text-white/60">Đang xác nhận thanh toán...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#151824] rounded-2xl border border-white/10 p-8 text-center">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-[#4D63FF] flex items-center justify-center overflow-hidden">
            {me?.avatarUrl ? (
              <img 
                src={me.avatarUrl} 
                alt="avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-3xl font-bold text-white">
                {(me?.displayName || me?.username || "U")[0].toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* User Info */}
        <h2 className="text-xl font-bold text-white">
          {me?.displayName || me?.username || "User"}
        </h2>
        <p className="text-white/50 text-sm mb-6">
          @{me?.username || "user"}
        </p>

        {/* Status Icon */}
        <div className="flex justify-center mb-4">
          {isSuccess ? (
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          )}
        </div>

        {/* Status Message */}
        <h1 className="text-3xl font-bold text-white mb-2">
          {isSuccess ? "Nạp tiền thành công!" : "Nạp tiền thất bại!"}
        </h1>
        <p className="text-white/60 mb-6">
          {isSuccess 
            ? (isAlreadyProcessed 
                ? "Giao dịch này đã được xử lý trước đó" 
                : "Giao dịch của bạn đã được xử lý thành công")
            : (message || "Có lỗi xảy ra, vui lòng thử lại")}
        </p>

        {/* Transaction Details - Chỉ hiển thị khi thành công */}
        {isSuccess && (
          <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
            {displayAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-white/60">Số tiền nạp</span>
                <span className="text-green-400 font-bold">
                  +{formatVND(displayAmount)}đ
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/60">Số dư hiện tại</span>
              <span className="text-white font-bold">
                {formatVND(me?.dPointAvailable || 0)} DPoint
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => navigate("/profile")}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#5B73FF] to-[#7B5CFF] text-white font-semibold shadow-lg shadow-[#4D63FF]/25 hover:brightness-110 transition"
        >
          Về hồ sơ
        </button>
      </div>
    </div>
  );
}
