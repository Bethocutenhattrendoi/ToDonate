import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, Loader2, ArrowLeft, Send, Wallet } from "lucide-react";
import { fetchMe } from "@/lib/auth";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

function formatVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0));
}

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

export default function DonatePage() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);

  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  // Load current user & creator
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [meData, creatorRes] = await Promise.all([
          fetchMe(),
          fetch(`${API_BASE}/api/explore/creator/${username}`),
        ]);

        setMe(meData);

        if (creatorRes.ok) {
          const creatorData = await creatorRes.json();
          setCreator(creatorData);
        } else {
          toast.error("Không tìm thấy người dùng");
          navigate("/donate");
        }
      } catch (err) {
        console.error("Load data error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [username, navigate]);

  // Handle donate
  const handleDonate = async () => {
    const donateAmount = Number(amount);

    if (!donateAmount || donateAmount < 1000) {
      return toast.error("Số tiền donate tối thiểu 1,000đ");
    }

    if (!me) {
      return toast.error("Vui lòng đăng nhập để donate");
    }

    if (donateAmount > (me.dPointAvailable || 0)) {
      return toast.error("Số dư không đủ. Vui lòng nạp thêm DPoint!");
    }

    setDonating(true);
    try {
      const res = await fetch(`${API_BASE}/api/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          receiverUsername: username,  // 👈 Sửa từ toUsername
          amount: donateAmount,
          message: message.trim(),
          name: me.name || me.displayName || me.username,  // 👈 Thêm name
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        toast.success(`Donate ${formatVND(donateAmount)}đ thành công! 🎉`);
        setAmount("");
        setMessage("");
        // Cập nhật balance từ response
        setMe(prev => ({ ...prev, dPointAvailable: data.dPointAvailable }));
      } else {
        toast.error(data.message || "Donate thất bại");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setDonating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14]">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-[#4D63FF] animate-spin" />
        </div>
      </div>
    );
  }

  if (!creator) return null;

  const avatarUrl = creator.avatarUrl
    || `https://api.dicebear.com/8.x/thumbs/svg?seed=${creator.username}`;

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate("/donate")}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        {/* Creator Info Card */}
        <div className="bg-[#151824] rounded-2xl border border-white/10 overflow-hidden mb-6">
          {/* Cover */}
          <div className="h-24 bg-gradient-to-br from-[#4D63FF]/40 to-[#FF6B6B]/40" />

          {/* Info */}
          <div className="px-6 pb-6 -mt-12">
            <img
              src={avatarUrl}
              alt={creator.displayName || creator.username}
              className="w-24 h-24 rounded-full border-4 border-[#151824] object-cover"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-2xl font-bold text-white mt-3">
              {creator.displayName || creator.username}
            </h1>
            <p className="text-white/50">@{creator.username}</p>
            {creator.bio && (
              <p className="text-white/70 mt-2">{creator.bio}</p>
            )}
          </div>
        </div>

        {/* Donate Form */}
        <div className="bg-[#151824] rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-6 h-6 text-[#FF6B6B]" />
            <h2 className="text-xl font-bold text-white">Gửi Donate</h2>
          </div>

          {/* Balance */}
          {me && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 mb-6">
              <div className="flex items-center gap-2 text-white/60">
                <Wallet size={18} />
                <span>Số dư của bạn</span>
              </div>
              <div className="font-bold text-white">
                {formatVND(me.dPointAvailable || 0)} DPoint
              </div>
            </div>
          )}

          {/* Quick amounts */}
          <div className="mb-4">
            <label className="text-sm text-white/60 mb-2 block">Chọn nhanh</label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`h-11 rounded-xl font-medium transition ${
                    Number(amount) === amt
                      ? "bg-[#4D63FF] text-white"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {formatVND(amt)}đ
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="mb-4">
            <label className="text-sm text-white/60 mb-2 block">
              Hoặc nhập số tiền khác
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Nhập số tiền..."
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#4D63FF]/50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
                VNĐ
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="text-sm text-white/60 mb-2 block">
              Lời nhắn (tuỳ chọn)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Gửi lời nhắn kèm donate..."
              rows={3}
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#4D63FF]/50 resize-none"
            />
            <div className="text-right text-xs text-white/30 mt-1">
              {message.length}/200
            </div>
          </div>

          {/* Donate Button */}
          <button
            onClick={handleDonate}
            disabled={donating || !amount || Number(amount) < 1000}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white font-bold text-lg flex items-center justify-center gap-2 hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {donating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send size={20} />
                <span>Donate {amount ? formatVND(amount) + "đ" : ""}</span>
              </>
            )}
          </button>

          {!me && (
            <p className="text-center text-white/50 text-sm mt-4">
              Bạn cần đăng nhập để donate
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
