import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchMe } from "@/lib/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || "Request failed");
  return data;
}

function formatVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0));
}

function AdminPage() {
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("campaignWithdrawals");

  const [campaignWithdrawals, setCampaignWithdrawals] = useState([]);
  const [userWithdrawals, setUserWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const m = await fetchMe();
        setMe(m);
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadCampaignWithdrawals() {
    const data = await api("/api/admin/withdrawals/campaigns?status=pending&limit=100");
    setCampaignWithdrawals(data.withdrawals || []);
  }

  async function loadUserWithdrawals() {
    const data = await api("/api/admin/withdrawals/users?status=pending&limit=100");
    setUserWithdrawals(data.withdrawals || []);
  }

  async function loadUsers() {
    const data = await api(`/api/admin/users?limit=100&q=${encodeURIComponent(q)}`);
    setUsers(data.users || []);
  }

  useEffect(() => {
    if (!me || me.role !== "admin") return;

    (async () => {
      const results = await Promise.allSettled([
        loadCampaignWithdrawals(),
        loadUserWithdrawals(),
        loadUsers(),
      ]);

      const errors = results
        .filter((r) => r.status === "rejected")
        .map((r) => r.reason?.message || "Request failed");

      if (errors.length) toast.error(errors[0]); // chỉ hiện 1 cái
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Đang tải...
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Bạn cần đăng nhập.
      </div>
    );
  }

  if (me.role !== "admin") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-3">
        <div className="text-white/70">Bạn không có quyền Admin.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-6">
          <div className="text-3xl font-extrabold">Admin Panel</div>
          <div className="text-white/60 mt-1">
            Duyệt rút tiền dự án • Duyệt rút tiền user • Quản lý user
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setTab("campaignWithdrawals")}
            className={`px-4 py-2 rounded-xl border ${
              tab === "campaignWithdrawals"
                ? "bg-pink-600 border-pink-400"
                : "bg-white/5 border-white/10"
            }`}
          >
            Campaign withdraw pending ({campaignWithdrawals.length})
          </button>

          <button
            onClick={() => setTab("userWithdrawals")}
            className={`px-4 py-2 rounded-xl border ${
              tab === "userWithdrawals"
                ? "bg-orange-600 border-orange-400"
                : "bg-white/5 border-white/10"
            }`}
          >
            User withdraw pending ({userWithdrawals.length})
          </button>

          <button
            onClick={() => setTab("users")}
            className={`px-4 py-2 rounded-xl border ${
              tab === "users" ? "bg-blue-600 border-blue-400" : "bg-white/5 border-white/10"
            }`}
          >
            Users ({users.length})
          </button>
        </div>

        {/* CAMPAIGN WITHDRAWALS */}
        {tab === "campaignWithdrawals" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-lg">Danh sách rút tiền dự án chờ duyệt</div>
              <button
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15"
                onClick={async () => {
                  try {
                    await loadCampaignWithdrawals();
                    toast.success("Đã refresh");
                  } catch (e) {
                    toast.error(e.message);
                  }
                }}
              >
                Refresh
              </button>
            </div>

            {campaignWithdrawals.length === 0 ? (
              <div className="text-white/60">Không có yêu cầu rút dự án pending.</div>
            ) : (
              <div className="space-y-3">
                {campaignWithdrawals.map((w) => (
                  <div key={w._id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          Dự án: {w.campaignSlug || w.campaignId} — Rút {formatVND(w.amount)} DPoint
                        </div>
                        <div className="text-sm text-white/60 mt-1">
                          Chủ dự án: {w.ownerUsername || "—"} ({w.ownerUserId})
                        </div>
                        <div className="text-sm text-white/60 mt-1">
                          {w.bankName} • {w.accountNumber} • {w.accountHolder}
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                          {w.createdAt ? new Date(w.createdAt).toLocaleString("vi-VN") : ""}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 font-bold"
                          onClick={async () => {
                            try {
                              await api(`/api/admin/withdrawals/campaigns/${w._id}/approve`, {
                                method: "POST",
                              });
                              toast.success("Đã duyệt rút tiền dự án");
                              await loadCampaignWithdrawals();
                            } catch (e) {
                              toast.error(e.message);
                            }
                          }}
                        >
                          Approve
                        </button>
                        <button
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 font-bold"
                          onClick={async () => {
                            try {
                              await api(`/api/admin/withdrawals/campaigns/${w._id}/reject`, {
                                method: "POST",
                              });
                              toast.success("Đã từ chối rút tiền dự án");
                              await loadCampaignWithdrawals();
                            } catch (e) {
                              toast.error(e.message);
                            }
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USER WITHDRAWALS */}
        {tab === "userWithdrawals" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-lg">Danh sách rút tiền user chờ duyệt</div>
              <button
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15"
                onClick={async () => {
                  try {
                    await loadUserWithdrawals();
                    toast.success("Đã refresh");
                  } catch (e) {
                    toast.error(e.message);
                  }
                }}
              >
                Refresh
              </button>
            </div>

            {userWithdrawals.length === 0 ? (
              <div className="text-white/60">Không có yêu cầu rút user pending.</div>
            ) : (
              <div className="space-y-3">
                {userWithdrawals.map((w) => {
                  const amount = Number(w.amount || 0);
                  const feeRate = typeof w.feeRate === "number" ? w.feeRate : 0.05;

                  // ưu tiên backend trả về, không thì tự tính
                  const fee =
                    typeof w.fee === "number" ? w.fee : Math.floor(amount * feeRate);

                  const received =
                    typeof w.receivedAmount === "number"
                      ? w.receivedAmount
                      : Math.max(0, amount - fee);

                  return (
                    <div key={w._id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            User: {w.userId} — Rút {formatVND(amount)} DPoint
                          </div>

                          {/*  thêm dòng phí + số nhận */}
                          <div className="text-sm text-white/60 mt-1">
                            Phí: {formatVND(fee)} ({Math.round(feeRate * 100)}%) • Nhận: {formatVND(received)} DPoint
                          </div>

                          <div className="text-sm text-white/60 mt-1">
                            {w.bankName} • {w.accountNumber} • {w.accountHolder}
                          </div>

                          <div className="text-xs text-white/40 mt-1">
                            {w.createdAt ? new Date(w.createdAt).toLocaleString("vi-VN") : ""}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {/* approve/reject giữ nguyên */}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="font-bold text-lg">Quản lý người dùng</div>
              <div className="flex gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm username/name..."
                  className="px-3 py-2 rounded-xl bg-black/40 border border-white/10"
                />
                <button
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold"
                  onClick={async () => {
                    try {
                      await loadUsers();
                    } catch (e) {
                      toast.error(e.message);
                    }
                  }}
                >
                  Search
                </button>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="text-white/60">Không có user.</div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u._id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          {u.username} ({u.name || "—"}) • role: {u.role} • banned:{" "}
                          {String(u.isBanned)}
                        </div>
                        <div className="text-sm text-white/60 mt-1">
                          Available: {formatVND(u.dPointAvailable)} • Locked: {formatVND(u.dPointLocked)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15"
                          onClick={async () => {
                            try {
                              const nextRole = u.role === "admin" ? "user" : "admin";
                              await api(`/api/admin/users/${u._id}`, {
                                method: "PATCH",
                                body: JSON.stringify({ role: nextRole }),
                              });
                              toast.success("Đã cập nhật role");
                              await loadUsers();
                            } catch (e) {
                              toast.error(e.message);
                            }
                          }}
                        >
                          Toggle role
                        </button>

                        <button
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 font-bold"
                          onClick={async () => {
                            try {
                              await api(`/api/admin/users/${u._id}`, {
                                method: "PATCH",
                                body: JSON.stringify({ isBanned: !u.isBanned }),
                              });
                              toast.success("Đã cập nhật trạng thái ban");
                              await loadUsers();
                            } catch (e) {
                              toast.error(e.message);
                            }
                          }}
                        >
                          {u.isBanned ? "Unban" : "Ban"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
