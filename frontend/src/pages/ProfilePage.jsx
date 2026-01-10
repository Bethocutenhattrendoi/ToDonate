import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchMe } from "../lib/auth";
import {
  Wallet,
  CreditCard,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?. message || "Request failed");
  return data;
}

function formatVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0));
}

// Tab Component
function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200
        ${active
          ? "bg-gradient-to-r from-[#4D63FF] to-[#6C7BFF] text-white shadow-lg shadow-[#4D63FF]/25"
          : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
        }
      `}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, subValue, gradient }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-white/70 mb-2">
          <Icon size={18} />
          <span className="text-sm">{label}</span>
        </div>
        <div className="text-3xl font-bold text-white">{value}</div>
        {subValue && <div className="text-sm text-white/60 mt-1">{subValue}</div>}
      </div>
    </div>
  );
}

// Transaction Item Component
function TransactionItem({ tx }) {
  const isPositive = ["topup", "donate_in", "refund"].includes(tx.type);
  
  const typeConfig = {
    topup: { label: "Nạp tiền", desc: tx.meta?.note || "Nạp qua VNPay", icon: "↓", color: "text-green-400", bg: "bg-green-500/20" },
    donate_out: { label: "Donate", desc: tx.meta?.note || "Donate", icon: "↑", color: "text-orange-400", bg: "bg-orange-500/20" },
    donate_in: { label: "Nhận donate", desc: tx.meta?.note || "Nhận donate", icon: "↓", color: "text-blue-400", bg: "bg-blue-500/20" },
    withdraw: { label: "Rút tiền", desc: tx.meta?.note || "Chuyển khoản", icon: "↑", color: "text-red-400", bg: "bg-red-500/20" },
    refund: { label: "Hoàn tiền", desc: tx.meta?.note || "Hoàn tiền", icon: "↓", color: "text-purple-400", bg: "bg-purple-500/20" },
  };

  const config = typeConfig[tx.type] || { label: tx.type, desc: "", icon: "•", color: "text-white", bg: "bg-white/10" };

  const statusConfig = {
    completed: { label: "Thành công", color: "text-green-400" },
    pending: { label: "Đang xử lý", color: "text-yellow-400" },
    failed: { label: "Thất bại", color: "text-red-400" },
  };

  const status = statusConfig[tx.status] || statusConfig.completed;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
        <span className={`text-lg ${config.color}`}>{config.icon}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white">{config.label}</div>
        <div className="text-sm text-white/50 truncate">{config.desc}</div>
        <div className="text-xs text-white/30 mt-1">{formatDate(tx.createdAt)}</div>
      </div>

      {/* Amount & Status */}
      <div className="text-right">
        <div className={`font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
          {isPositive ? "+" : "-"}{formatVND(Math.abs(tx.amount))}
        </div>
        <div className={`text-xs flex items-center gap-1 justify-end ${status. color}`}>
          <span>⊙</span> {status.label}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Topup state
  const [topupAmount, setTopupAmount] = useState(100000);
  const [topupLoading, setTopupLoading] = useState(false);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState(50000);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Bank state
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [branch, setBranch] = useState("");
  const [bankLoading, setBankLoading] = useState(false);

  // Transactions
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const topupPresets = [50000, 100000, 200000, 500000, 1000000];
  const withdrawPresets = [50000, 100000, 200000, 500000];
  const banks = ["Vietcombank", "Techcombank", "BIDV", "Agribank", "VPBank", "MBBank", "ACB", "Sacombank", "TPBank", "VIB"];

  async function loadUser() {
    setLoading(true);
    try {
      const data = await fetchMe();
      console.log("Profile data:", data); // Debug
      
      if (data && data._id) {
        setMe(data);
        setBankName(data.bankAccount?.bankName || "");
        setAccountHolder(data.bankAccount?.accountHolder || "");
        setBranch(data.bankAccount?.branch || "");
        setAccountNumber("");
      } else {
        setMe(null);
      }
    } catch (err) {
      console.error("loadUser error:", err);
      setMe(null);
    } finally {
      setLoading(false); // 👈 Luôn tắt loading
    }
  }

  // load user
  useEffect(() => {
    loadUser();
  }, []);

  // Fetch transactions khi load trang
  useEffect(() => {
    async function fetchTransactions() {
      setLoadingTx(true);
      try {
        const res = await apiFetch("/api/wallet/transactions?limit=10");
        setTransactions(res.transactions || []);
      } catch (err) {
        console.error("Fetch transactions error:", err);
      } finally {
        setLoadingTx(false);
      }
    }
    
    if (me) {
      fetchTransactions();
    }
  }, [me]);

  // Handle VNPay Topup
  async function handleTopup() {
    const amount = Number(topupAmount);
    if (!amount || amount < 10000) return toast.error("Số tiền nạp tối thiểu 10,000đ");
    if (amount > 50000000) return toast.error("Số tiền nạp tối đa 50,000,000đ");

    setTopupLoading(true);
    try {
      const res = await apiFetch("/api/vnpay/create", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });

      console.log("VNPay response:", res); // Debug

      if (res.paymentUrl) {
        // Redirect đến trang VNPay
        window.location.href = res.paymentUrl;
      } else {
        toast.error("Không thể tạo link thanh toán");
        setTopupLoading(false);
      }
    } catch (err) {
      console.error("Topup error:", err);
      toast.error(err.message || "Nạp tiền thất bại");
      setTopupLoading(false);
    }
  }

  // Handle Withdraw
  async function handleWithdraw() {
    const amount = Number(withdrawAmount);
    if (!amount || amount < 50000) return toast.error("Số tiền rút tối thiểu 50.000đ");
    if (amount > (me?. dPointAvailable || 0)) return toast.error("Số dư không đủ");
    if (! me?.bankAccount?.bankName) return toast.error("Vui lòng cập nhật tài khoản ngân hàng trước");

    setWithdrawLoading(true);
    try {
      await apiFetch("/api/wallet/withdraw", {
        method: "POST",
        body:  JSON.stringify({ amount }),
      });
      toast.success("Yêu cầu rút tiền đã được gửi!");
      // ✅ Reload user data
      await loadUser();
      // ✅ Reload transactions
      const res = await apiFetch("/api/wallet/transactions?limit=10");
      setTransactions(res.transactions || []);
      setWithdrawAmount(50000);
    } catch (err) {
      toast.error(err.message || "Rút tiền thất bại");
    } finally {
      setWithdrawLoading(false);
    }
  }

  // Handle Save Bank
  async function handleSaveBank() {
    if (!bankName || !accountNumber || ! accountHolder) {
      return toast.error("Vui lòng điền đầy đủ thông tin ngân hàng");
    }

    setBankLoading(true);
    try {
      await apiFetch("/api/profile/bank", {
        method:  "POST",
        body: JSON.stringify({ bankName, accountNumber, accountHolder, branch }),
      });
      toast.success("Cập nhật tài khoản ngân hàng thành công!");
      await fetchMe();
    } catch (err) {
      toast.error(err.message || "Cập nhật thất bại");
    } finally {
      setBankLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0B0E14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#4D63FF] border-t-transparent rounded-full animate-spin" />
          <div className="text-white/60">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!me || !me._id) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0B0E14] flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-white mb-2">Chưa đăng nhập</div>
          <div className="text-white/60 mb-4">Vui lòng đăng nhập để xem hồ sơ</div>
          <button
            onClick={() => window.location.href = "/"}
            className="px-6 py-2 rounded-xl bg-[#4D63FF] text-white font-semibold hover:brightness-110 transition"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-[#0B0E14] text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4D63FF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Header - Avatar lấy từ me. avatar (Google avatar) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4D63FF] to-[#8B5CFF] p-0.5">
              <img
                src={me.avatar || `https://api.dicebear.com/8.x/thumbs/svg?seed=${me. username}`}
                alt="avatar"
                className="w-full h-full rounded-2xl object-cover bg-[#151824]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{me.name || me.username}</h1>
              <div className="text-white/60 text-sm">@{me.username}</div>
            </div>
          </div>
          {/* Đã xóa nút "Sao chép link" */}
        </div>

        {/* Stats Cards - Hiển thị DPoint từ API */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={Wallet}
            label="DPoint khả dụng"
            value={formatVND(me. dPointAvailable || 0)}
            subValue="Có thể sử dụng ngay"
            gradient="bg-gradient-to-br from-[#4D63FF] to-[#6C7BFF]"
          />
          <StatCard
            icon={Clock}
            label="DPoint đang khóa"
            value={formatVND(me.dPointLocked || 0)}
            subValue="Đang chờ xử lý rút"
            gradient="bg-gradient-to-br from-orange-500 to-amber-500"
          />
          <StatCard
            icon={Sparkles}
            label="Tổng DPoint"
            value={formatVND((me.dPointAvailable || 0) + (me.dPointLocked || 0))}
            subValue="Khả dụng + Đang khóa"
            gradient="bg-gradient-to-br from-purple-500 to-pink-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={History} label="Tổng quan" />
          <TabButton active={activeTab === "topup"} onClick={() => setActiveTab("topup")} icon={ArrowDownToLine} label="Nạp tiền" />
          <TabButton active={activeTab === "withdraw"} onClick={() => setActiveTab("withdraw")} icon={ArrowUpFromLine} label="Rút tiền" />
          <TabButton active={activeTab === "bank"} onClick={() => setActiveTab("bank")} icon={Building2} label="Ngân hàng" />
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="bg-[#151824] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={20} className="text-white/60" />
                  <h3 className="text-lg font-semibold text-white">Lịch sử giao dịch</h3>
                </div>

                {loadingTx ? (
                  <div className="text-center text-white/50 py-8">Đang tải...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center text-white/50 py-8">Chưa có giao dịch nào</div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <TransactionItem key={tx._id} tx={tx} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Topup Tab */}
            {activeTab === "topup" && (
              <div className="bg-[#151824] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <CreditCard size={20} />
                  Nạp DPoint qua VNPay
                </h2>

                {/* VNPay Banner */}
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#0066B3]/20 to-[#E31837]/20 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-[#0066B3] font-bold text-xs">VNPAY</span>
                    </div>
                    <div>
                      <div className="font-semibold text-white">Thanh toán an toàn với VNPay</div>
                      <div className="text-xs text-white/60">Hỗ trợ QR Code, Thẻ ATM, Visa/Mastercard</div>
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                  <label className="text-sm text-white/70 mb-2 block">Số tiền nạp</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      className="w-full h-14 px-4 pr-16 rounded-xl bg-[#10131B] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4D63FF]/50 text-xl font-bold"
                      placeholder="100,000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-semibold">VNĐ</span>
                  </div>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {topupPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setTopupAmount(preset)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        Number(topupAmount) === preset
                          ? "bg-[#4D63FF] text-white"
                          : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {formatVND(preset)}đ
                    </button>
                  ))}
                </div>

                {/* Info */}
                <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Số tiền nạp</span>
                    <span className="text-white font-semibold">{formatVND(topupAmount)}đ</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Phí giao dịch</span>
                    <span className="text-green-400 font-semibold">Miễn phí</span>
                  </div>
                  <div className="border-t border-white/10 my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">DPoint nhận được</span>
                    <span className="text-[#4D63FF] font-bold text-lg">{formatVND(topupAmount)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleTopup}
                  disabled={topupLoading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#4D63FF] to-[#6C7BFF] text-white font-bold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {topupLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Nạp ngay với VNPay
                    </>
                  )}
                </button>
                <div className="mt-4 text-xs text-white/50 text-center">
                  * Tỷ giá:  1 VNĐ = 1 DPoint.  Giao dịch được xử lý tức thì. 
                </div>
              </div>
            )}

            {/* Withdraw Tab */}
            {activeTab === "withdraw" && (
              <div className="bg-[#151824] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <ArrowUpFromLine size={20} />
                  Rút DPoint về ngân hàng
                </h2>

                {/* Bank Info */}
                {me.bankAccount?. bankName ?  (
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                          <Building2 size={18} className="text-green-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{me.bankAccount.bankName}</div>
                          <div className="text-sm text-white/60">
                            {me.bankAccount. accountNumberMasked} • {me.bankAccount.accountHolder}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab("bank")} className="text-sm text-[#4D63FF] hover: underline">
                        Thay đổi
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                        <Building2 size={18} className="text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-yellow-400">Chưa có tài khoản ngân hàng</div>
                        <div className="text-sm text-white/60">Vui lòng thêm tài khoản để rút tiền</div>
                      </div>
                      <button
                        onClick={() => setActiveTab("bank")}
                        className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 font-semibold text-sm hover:bg-yellow-500/30 transition"
                      >
                        Thêm ngay
                      </button>
                    </div>
                  </div>
                )}

                {/* Amount Input */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white/70">Số DPoint muốn rút</label>
                    <button
                      onClick={() => setWithdrawAmount(me.dPointAvailable || 0)}
                      className="text-xs text-[#4D63FF] hover: underline"
                    >
                      Rút tất cả ({formatVND(me.dPointAvailable || 0)})
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e. target.value)}
                      className="w-full h-14 px-4 pr-20 rounded-xl bg-[#10131B] border border-white/10 focus:outline-none focus:ring-2 focus: ring-[#4D63FF]/50 text-xl font-bold"
                      placeholder="50,000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-semibold">DPoint</span>
                  </div>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {withdrawPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setWithdrawAmount(preset)}
                      disabled={preset > (me.dPointAvailable || 0)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        Number(withdrawAmount) === preset
                          ? "bg-[#4D63FF] text-white"
                          : preset > (me.dPointAvailable || 0)
                          ? "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
                          : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {formatVND(preset)}
                    </button>
                  ))}
                </div>

                {/* Info */}
                <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">DPoint rút</span>
                    <span className="text-white font-semibold">{formatVND(withdrawAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Phí rút (5%)</span>
                    <span className="text-orange-400 font-semibold">
                      -{formatVND(Math.floor(Number(withdrawAmount) * 0.05))}
                    </span>
                  </div>
                  <div className="border-t border-white/10 my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Số tiền nhận được</span>
                    <span className="text-green-400 font-bold text-lg">
                      {formatVND(Math.floor(Number(withdrawAmount) * 0.95))}đ
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawLoading || ! me.bankAccount?.bankName}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold hover:brightness-110 transition disabled:opacity-50 disabled: cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {withdrawLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <ArrowUpFromLine size={18} />
                      Tạo yêu cầu rút tiền
                    </>
                  )}
                </button>
                <div className="mt-4 text-xs text-white/50 text-center">
                  * Yêu cầu rút tiền sẽ được xử lý trong 1-3 ngày làm việc.
                </div>
              </div>
            )}

            {/* Bank Tab */}
            {activeTab === "bank" && (
              <div className="bg-[#151824] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Building2 size={20} />
                  Tài khoản ngân hàng
                </h2>

                {/* Current Bank Info */}
                {me.bankAccount?.bankName && (
                  <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xs text-white/50 mb-2">Tài khoản hiện tại</div>
                    <div className="font-semibold">{me.bankAccount.bankName}</div>
                    <div className="text-sm text-white/70">
                      {me.bankAccount.accountNumberMasked} • {me.bankAccount.accountHolder}
                    </div>
                  </div>
                )}

                {/* Bank Form */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/70 mb-2 block">Ngân hàng</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-[#10131B] border border-white/10 focus:outline-none focus: ring-2 focus:ring-[#4D63FF]/50 appearance-none cursor-pointer"
                    >
                      <option value="">Chọn ngân hàng</option>
                      {banks.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-white/70 mb-2 block">Số tài khoản</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-[#10131B] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4D63FF]/50"
                      placeholder="Nhập số tài khoản"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white/70 mb-2 block">Chủ tài khoản</label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value. toUpperCase())}
                      className="w-full h-12 px-4 rounded-xl bg-[#10131B] border border-white/10 focus: outline-none focus:ring-2 focus:ring-[#4D63FF]/50 uppercase"
                      placeholder="VD:  NGUYEN VAN A"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white/70 mb-2 block">Chi nhánh (tuỳ chọn)</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-[#10131B] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4D63FF]/50"
                      placeholder="VD:  Hà Nội"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSaveBank}
                  disabled={bankLoading}
                  className="w-full h-12 mt-6 rounded-xl bg-gradient-to-r from-[#4D63FF] to-[#6C7BFF] text-white font-bold hover: brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {bankLoading ?  (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang lưu... 
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Lưu tài khoản
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-[#151824] border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Thao tác nhanh</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab("topup")}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4D63FF]/20 flex items-center justify-center">
                      <ArrowDownToLine size={16} className="text-[#4D63FF]" />
                    </div>
                    <span className="text-sm">Nạp DPoint</span>
                  </div>
                  <ChevronRight size={16} className="text-white/40" />
                </button>

                <button
                  onClick={() => setActiveTab("withdraw")}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <ArrowUpFromLine size={16} className="text-orange-400" />
                    </div>
                    <span className="text-sm">Rút tiền</span>
                  </div>
                  <ChevronRight size={16} className="text-white/40" />
                </button>

                <button
                  onClick={() => setActiveTab("bank")}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Building2 size={16} className="text-green-400" />
                    </div>
                    <span className="text-sm">Ngân hàng</span>
                  </div>
                  <ChevronRight size={16} className="text-white/40" />
                </button>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gradient-to-br from-[#4D63FF]/20 to-purple-500/20 border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold mb-2">Cần hỗ trợ? </h3>
              <p className="text-sm text-white/60 mb-4">Liên hệ với chúng tôi nếu bạn gặp vấn đề với giao dịch.</p>
              <button className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm font-semibold">
                Liên hệ hỗ trợ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}