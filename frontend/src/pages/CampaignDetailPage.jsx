import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Send } from "lucide-react";
import toast from "react-hot-toast";
import { fetchMe } from "@/lib/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

function formatVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0));
}

function getReceiverUsername(c) {
  return (
    c?.receiverUsername ||
    c?.creatorUsername ||
    c?.ownerUsername ||
    c?.username ||
    c?.user?.username ||
    c?.creator?.username ||
    c?.createdBy?.username ||
    c?.owner?.username ||
    c?.createdByUsername ||
    ""
  );
}

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

export default function CampaignDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [me, setMe] = useState(null);

  // donate
  const [donating, setDonating] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const DONATIONS_PER_PAGE = 5;
  const [donationPage, setDonationPage] = useState(1);

  const totalDonationPages = useMemo(() => {
    const total = Math.ceil((donations?.length || 0) / DONATIONS_PER_PAGE);
    return total > 0 ? total : 1;
  }, [donations?.length]);

  const pagedDonations = useMemo(() => {
    const start = (donationPage - 1) * DONATIONS_PER_PAGE;
    return (donations || []).slice(start, start + DONATIONS_PER_PAGE);
  }, [donations, donationPage]);

  // khi donations thay đổi (refresh, donate mới) -> đảm bảo không vượt quá tổng trang
  useEffect(() => {
    setDonationPage((p) => Math.min(p, totalDonationPages));
  }, [totalDonationPages]);

  // withdraw (owner only)
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  // API helper
  async function api(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || "Request failed");
    return data;
  }

  // ====== owner check (ĐẶT TRƯỚC mọi function dùng isOwner) ======
  const receiverUsername = useMemo(() => getReceiverUsername(campaign), [campaign]);
  const isOwner = useMemo(() => {
    if (!me?.username) return false;
    if (!receiverUsername) return false;
    return String(me.username) === String(receiverUsername);
  }, [me?.username, receiverUsername]);

  // ====== loaders ======
  async function loadCampaign() {
    setLoading(true);
    setErr("");
    try {
      let res = await fetch(`${API_BASE}/api/campaigns/${encodeURIComponent(slug)}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const listRes = await fetch(`${API_BASE}/api/campaigns`, { credentials: "include" });
        const listData = await listRes.json().catch(() => ({}));
        const arr = Array.isArray(listData) ? listData : listData.campaigns || [];
        const found = arr.find((c) => c.slug === slug) || null;
        if (!found) throw new Error("Không tìm thấy dự án.");
        setCampaign(found);
        return;
      }

      const data = await res.json().catch(() => ({}));
      const c = data?.campaign || data;
      if (!c) throw new Error("Không tìm thấy dự án.");
      setCampaign(c);
    } catch (e) {
      setErr(e?.message || "Không tải được dự án.");
      toast.error(e?.message || "Không tải được dự án.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDonations() {
    if (!campaign?.slug) return;
    setDonationsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/campaigns/donations/list?campaignSlug=${encodeURIComponent(
          campaign.slug
        )}&limit=50`
      );
      const data = await res.json().catch(() => ({}));
      setDonations(Array.isArray(data?.donations) ? data.donations : []);
    } catch {
      setDonations([]);
    } finally {
      setDonationsLoading(false);
    }
  }

  async function loadOwnerWithdrawals() {
    if (!campaign?.slug || !isOwner) return;

    setWithdrawalsLoading(true);
    try {
      const data = await api(
        `/api/campaigns/owner/withdrawals?campaignSlug=${encodeURIComponent(campaign.slug)}&limit=50`
      );
      setWithdrawals(Array.isArray(data?.withdrawals) ? data.withdrawals : []);
    } catch {
      setWithdrawals([]);
    } finally {
      setWithdrawalsLoading(false);
    }
  }

  //  effects 
  useEffect(() => {
    if (slug) loadCampaign();
    // eslint-disable-next-line
  }, [slug]);

  useEffect(() => {
    (async () => {
      try {
        const meData = await fetchMe();
        setMe(meData || null);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (campaign?.slug) loadDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.slug]);

  useEffect(() => {
    if (isOwner && campaign?.slug) loadOwnerWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, campaign?.slug]);

  //  GOAL / RAISED 
  const goal = Number(campaign?.goal || 0);
  const raised = Number(campaign?.raised || 0);
  const progress = goal > 0 ? Math.min(100, Math.max(0, Math.round((raised / goal) * 100))) : 0;

  const campaignBalanceAvailable = Number(campaign?.balanceAvailable || 0);
  const campaignBalanceLocked = Number(campaign?.balanceLocked || 0);

  //  DONATE 
  const handleDonate = async () => {
    const donateAmount = Number(amount);

    if (!donateAmount || donateAmount < 1000) return toast.error("Số tiền donate tối thiểu 1.000đ");
    if (!me) return toast.error("Vui lòng đăng nhập để donate");
    if (donateAmount > (me.dPointAvailable || 0)) return toast.error("Số dư không đủ. Vui lòng nạp thêm DPoint!");
    if (!campaign?.slug) return toast.error("Thiếu thông tin dự án (campaignSlug)");

    setDonating(true);
    try {
      const res = await fetch(`${API_BASE}/api/campaigns/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          campaignSlug: campaign.slug,
          amount: donateAmount,
          message: message.trim(),
          name: anonymous ? "Ẩn danh" : (me.name || me.displayName || me.username),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || data.message || "Ủng hộ thất bại");
        return;
      }

      toast.success(data.message || "Ủng hộ thành công!");
      setAmount("");
      setMessage("");

      if (data.dPointAvailable != null) {
        setMe((prev) => ({ ...prev, dPointAvailable: data.dPointAvailable }));
      }

      await loadCampaign();
      await loadDonations();
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setDonating(false);
    }
  };

  //  OWNER: REQUEST WITHDRAW 
  async function handleCampaignWithdraw() {
    const money = Number(withdrawAmount);

    if (!me) return toast.error("Vui lòng đăng nhập");
    if (!isOwner) return toast.error("Bạn không có quyền rút tiền dự án này");
    if (!Number.isFinite(money) || money < 50000) return toast.error("Rút tối thiểu 50.000 DPoint");
    if (money > campaignBalanceAvailable) {
      return toast.error(`Số dư dự án không đủ. Khả dụng: ${formatVND(campaignBalanceAvailable)} DPoint`);
    }

    //  /api/me chỉ có accountNumberMasked nên check theo masked
    const ba = me?.bankAccount || {};
    const hasAcc =
      !!ba.bankName && !!ba.accountHolder && (!!ba.accountNumberMasked || !!ba.accountNumber);

    if (!hasAcc) {
      return toast.error("Bạn chưa nhập tài khoản ngân hàng (vào Profile > Ngân hàng để cập nhật)");
    }

    setWithdrawing(true);
    try {
      //  endpoint chuẩn theo router mới
      await api(`/api/campaigns/${encodeURIComponent(campaign.slug)}/withdraw`, {
        method: "POST",
        body: JSON.stringify({ amount: money }),
      });

      toast.success("Đã tạo yêu cầu rút (chờ admin duyệt)");
      setWithdrawAmount("");

      await loadCampaign();
      await loadOwnerWithdrawals();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex items-center justify-center">
        Đang tải dự án...
      </div>
    );
  }

  if (err || !campaign) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center px-4">
        <div className="text-white/70 mb-4">{err || "Không tìm thấy dự án"}</div>
        <button
          onClick={() => navigate("/campaign")}
          className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-3 rounded-xl"
        >
          Quay về danh sách dự án
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative bg-black text-white overflow-hidden">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255, 20, 147, 0.13), transparent 50%),
            radial-gradient(ellipse 160% 130% at 10% 10%, rgba(0, 255, 255, 0.10), transparent 65%),
            radial-gradient(ellipse 140% 130% at 90% 90%, rgba(138, 43, 226, 0.14), transparent 65%),
            #000000
          `,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate("/campaign")}
          className="mb-6 inline-flex items-center gap-2 text-white/80 hover:text-white"
        >
          ← Quay về danh sách
        </button>

        <div className="bg-[#151824]/90 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <img
            src={campaign.coverUrl || "https://placehold.co/1200x600"}
            alt={campaign.name}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-6">
            {campaign.category && (
              <span className="inline-block bg-pink-600 text-white px-3 py-1 text-xs rounded-full mb-3">
                {campaign.category}
              </span>
            )}

            <h1 className="text-4xl font-extrabold mb-3">{campaign.name}</h1>

            {campaign.shortDescription && (
              <div className="text-white/80 mb-6">{campaign.shortDescription}</div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 mb-10">
              {/* LEFT */}
              <div className="flex-1">
                {/* Goal */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-white/70">Mục tiêu dự án</div>
                    <div className="text-lg font-bold text-white">{formatVND(goal)}đ</div>
                  </div>

                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-pink-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/70">Đã đạt được</div>
                    <div className="text-pink-500 font-extrabold text-xl">{formatVND(raised)}đ</div>
                  </div>

                  <div className="mt-2 text-xs text-white/60">Tiến độ: {progress}%</div>
                </div>

                {/*  OWNER ONLY: Withdraw */}
                {isOwner && (
                  <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-base font-bold">Rút tiền dự án</div>
                      <button
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15"
                        onClick={loadOwnerWithdrawals}
                      >
                        Refresh
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-xs text-white/60">Số dư dự án khả dụng</div>
                        <div className="text-xl font-extrabold mt-1">
                          {formatVND(campaignBalanceAvailable)} DPoint
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-xs text-white/60">Đang khóa (chờ admin duyệt)</div>
                        <div className="text-xl font-extrabold mt-1">
                          {formatVND(campaignBalanceLocked)} DPoint
                        </div>
                      </div>
                    </div>

                    <div className="text-white/60 mb-2">Nhập số DPoint muốn rút</div>
                    <div className="flex gap-3 mb-3">
                      <input
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-1 h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white"
                        placeholder="50000"
                        inputMode="numeric"
                      />
                      <button
                        onClick={handleCampaignWithdraw}
                        disabled={withdrawing}
                        className="h-12 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold disabled:opacity-60"
                      >
                        {withdrawing ? "Đang tạo..." : "Tạo yêu cầu rút"}
                      </button>
                    </div>

                    <div className="text-xs text-white/50 mb-4">
                      * Tiền sẽ được “khóa” và chờ admin duyệt. Yêu cầu rút tối thiểu 50.000 DPoint.
                    </div>

                    <div className="text-sm font-bold mb-2">Lịch sử yêu cầu rút (campaign này)</div>
                    {withdrawalsLoading ? (
                      <div className="text-white/60 text-sm">Đang tải...</div>
                    ) : withdrawals.length === 0 ? (
                      <div className="text-white/60 text-sm">Chưa có yêu cầu rút nào.</div>
                    ) : (
                      <div className="space-y-2">
                        {withdrawals.map((w) => (
                          <div key={w._id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm">
                                Rút <b>{formatVND(w.amount)}</b> •{" "}
                                <span className="text-white/60">{w.status}</span>
                              </div>
                              <div className="text-xs text-white/50">
                                {w.createdAt ? new Date(w.createdAt).toLocaleString("vi-VN") : ""}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Donations history */}
                <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-base font-bold">Lịch sử ủng hộ</div>
                    <div className="text-xs text-white/60">
                      {donations?.length ? `Tổng ${donations.length} lượt ủng hộ` : ""}
                    </div>
                  </div>

                  {donationsLoading ? (
                    <div className="text-white/60 text-sm">Đang tải lịch sử...</div>
                  ) : donations.length === 0 ? (
                    <div className="text-white/60 text-sm">Chưa có lượt ủng hộ nào.</div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {pagedDonations.map((d) => (
                          <div
                            key={d._id}
                            className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl p-3"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate">
                                {d?.name ||
                                  d?.senderUserId?.displayName ||
                                  d?.senderUsername ||
                                  "Ẩn danh"}
                              </div>
                              <div className="text-xs text-white/60 truncate">
                                {d?.message ? d.message : "—"}
                              </div>
                              <div className="text-[11px] text-white/50 mt-1">
                                {d?.createdAt ? new Date(d.createdAt).toLocaleString("vi-VN") : ""}
                              </div>
                            </div>

                            <div className="text-pink-500 font-extrabold whitespace-nowrap">
                              {formatVND(d.amount)}đ
                            </div>
                          </div>
                        ))}
                      </div>

                      {/*  NÚT PHÂN TRANG */}
                      {totalDonationPages > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={donationPage <= 1}
                            onClick={() => setDonationPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50"
                          >
                            Trước
                          </button>

                          {/* Số trang nằm giữa 2 nút, căn giữa bằng flex-grow */}
                          <div className="flex items-center gap-1 flex-grow justify-center max-w-xs">
                            {Array.from({ length: totalDonationPages }, (_, i) => i + 1).map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setDonationPage(p)}
                                className={`w-9 h-9 rounded-xl border text-sm font-semibold transition flex items-center justify-center ${
                                  p === donationPage
                                    ? "bg-pink-600 border-pink-400"
                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                }`}
                              >
                                <span className="mx-auto">{p}</span>
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            disabled={donationPage >= totalDonationPages}
                            onClick={() => setDonationPage((p) => Math.min(totalDonationPages, p + 1))}
                            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50"
                          >
                            Sau
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <div className="w-full lg:w-[420px]">
                <div className="bg-[#151824] rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Heart className="w-6 h-6 text-[#FF6B6B]" />
                    <h2 className="text-xl font-bold text-white">Gửi Donate</h2>
                  </div>

                  {me && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 mb-6">
                      <div className="text-white/60">Số dư của bạn</div>
                      <div className="text-white font-bold">
                        {formatVND(me.dPointAvailable || 0)} DPoint
                      </div>
                    </div>
                  )}

                  <div className="text-white/60 mb-3">Chọn nhanh</div>
                  <div className="flex flex-wrap gap-3 mb-5">
                    {QUICK_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAmount(String(a))}
                        className="px-4 q-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition"
                      >
                        {formatVND(a)}đ
                      </button>
                    ))}
                  </div>

                  <div className="text-white/60 mb-2">Hoặc nhập số tiền khác</div>
                  <div className="relative mb-5">
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      inputMode="numeric"
                      placeholder="Nhập số tiền..."
                      className="w-full h-12 pl-4 pr-16 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/40"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 text-sm">
                      VND
                    </div>
                  </div>

                  <div className="text-white/60 mb-2">Lời nhắn (tuỳ chọn)</div>
                  <div className="relative mb-6">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                      placeholder="Gửi lời nhắn kèm donate..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/40 resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-white/50">
                      {message.length}/200
                    </div>
                  </div>

                  <label className="flex items-center gap-3 mb-5 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="w-4 h-4 accent-pink-500"
                    />
                    <span className="text-sm text-white/80">Ủng hộ ẩn danh</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleDonate}
                    disabled={donating}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from mink-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:brightness-110 active:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                    {donating ? "Đang xử lý..." : "Donate"}
                  </button>
                </div>
              </div>
            </div>

            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: campaign.description || "" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
