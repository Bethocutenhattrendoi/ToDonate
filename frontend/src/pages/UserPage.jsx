import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

const coverUrl =
  "https://images.unsplash.com/photo-1520975958225-1a3b9fdf22d4?auto=format&fit=crop&w=1920&q=60";

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="text-blue-400">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm-1.1 14.2-3.6-3.6 1.4-1.4 2.2 2.2 4.7-4.7 1.4 1.4Z"
      />
    </svg>
  );
}

function MsgIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="text-white/70">
      <path
        fill="currentColor"
        d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"
      />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="text-white/80">
      <path
        fill="currentColor"
        d="M21 8.5V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5l9 5.2 9-5.2ZM19 6l-7 4-7-4h14Z"
      />
    </svg>
  );
}

function formatVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0));
}

function timeAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} ngày trước`;
  if (h > 0) return `${h} giờ trước`;
  if (m > 0) return `${m} phút trước`;
  return `${s} giây trước`;
}

function withinRange(createdAt, mode) {
  if (!createdAt) return true;
  const t = new Date(createdAt).getTime();
  const now = Date.now();
  const diff = now - t;
  const day = 24 * 60 * 60 * 1000;
  if (mode === "day") return diff <= day;
  if (mode === "week") return diff <= 7 * day;
  if (mode === "month") return diff <= 30 * day;
  return true;
}

export default function UserPage() {
  const { username } = useParams();

  // form
  const [fromName, setFromName] = useState("");
  const [amount, setAmount] = useState(50000);
  const [message, setMessage] = useState("");

  // data
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState([]);
  const [lbTab, setLbTab] = useState("day"); // day|week|month

  const avatarUrl = useMemo(() => {
    return `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(username || "user")}`;
  }, [username]);

  const presets = [50000, 100000, 150000];

  async function fetchDonations() {
    setLoading(true);
    try {
      //  lọc theo username (backend phần 3 bên dưới)
      const res = await fetch(`${API_BASE}/api/donate?username=${encodeURIComponent(username || "")}&limit=200`);
      const data = await res.json();
      setDonations(Array.isArray(data) ? data : []);
    } catch {
      setDonations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const leaderboard = useMemo(() => {
    const map = new Map();
    donations
      .filter((d) => withinRange(d.createdAt, lbTab))
      .forEach((d) => {
        const key = d.name || "Ẩn danh";
        map.set(key, (map.get(key) || 0) + Number(d.amount || 0));
      });
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [donations, lbTab]);

  async function handleDonate() {
    if (!fromName.trim()) return alert("Nhập tên hiển thị");
    if (!amount || Number(amount) <= 0) return alert("Số tiền không hợp lệ");

    try {
      const res = await fetch(`${API_BASE}/api/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverUsername: username, //  quan trọng để đúng từng trang
          name: fromName.trim(),
          amount: Number(amount),
          message: message || "",
          status: "success",
        }),
      });
      if (!res.ok) throw new Error("fail");
      setFromName("");
      setAmount(50000);
      setMessage("");
      fetchDonations();
    } catch {
      alert("Không gửi donate được. Kiểm tra backend/CORS.");
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0B0E14] text-white">
      {/* TOP NAV (giống ảnh) */}
      <div className="h-12 bg-black/80 border-b border-white/5 flex items-center">
        <div className="max-w-6xl mx-auto w-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="font-bold tracking-wide text-white/90">zypage</div>
            <div className="text-xs font-semibold text-white/60 hover:text-white cursor-pointer">DONATE</div>
            <div className="text-xs font-semibold text-white/60 hover:text-white cursor-pointer">BOOKING</div>
          </div>
          <div className="flex items-center gap-3 text-white/70">
            <div className="w-7 h-7 rounded-full bg-white/10" />
            <div className="w-7 h-7 rounded-full bg-white/10" />
            <div className="w-7 h-7 rounded-full bg-yellow-500/20 border border-yellow-400/20" />
          </div>
        </div>
      </div>

      {/* COVER */}
      <div className="relative">
        <div className="h-40 md:h-52 w-full overflow-hidden">
          <img src={coverUrl} className="w-full h-full object-cover" alt="cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/45 to-black/10" />
        </div>

        <div className="max-w-6xl mx-auto px-4">
          {/* TAB Donate (màu xanh, giống ảnh) */}
          <div className="-mt-8 flex items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-t-xl bg-[#4D63FF] text-sm font-semibold shadow">
              <span className="w-2 h-2 rounded-full bg-yellow-300" />
              Donate
            </div>
          </div>

          {/* PROFILE BAR */}
          <div className="relative bg-[#151824] border border-white/10 rounded-2xl px-6 py-5">
            <div className="absolute -left-3 -top-6">
              <div className="w-16 h-16 rounded-full bg-[#0B0E14] p-1 border border-white/10">
                <img src={avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
              </div>
            </div>

            <div className="pl-16 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold">{username}</div>
                <CheckIcon />
              </div>

              <div className="flex items-center gap-2">
                <button className="h-9 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition inline-flex items-center gap-2">
                  <MsgIcon />
                  <span className="text-sm">Nhắn tin</span>
                </button>
                <button className="h-9 px-4 rounded-xl bg-[#4D63FF] hover:bg-[#3f56ff] transition inline-flex items-center gap-2">
                  <BoxIcon />
                  <span className="text-sm font-semibold">Tạo hộp</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2 CỘT */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
            {/* LEFT */}
            <div className="lg:col-span-5 space-y-4">
              {/* DONATE CARD */}
              <div className="bg-[#151824] border border-white/10 rounded-2xl p-5">
                <div className="text-lg font-semibold mb-3">Donate</div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-white/60 mb-1">Từ: tên hiển thị</div>
                    <input
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="Cường Nguyễn"
                      className="w-full h-10 px-3 rounded-xl bg-[#10131B] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4D63FF]/40"
                    />
                  </div>

                  <div>
                    <div className="text-xs text-white/60 mb-1">Số tiền</div>
                    <div className="flex items-center gap-2">
                      <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="flex-1 h-10 px-3 rounded-xl bg-[#10131B] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4D63FF]/40"
                      />
                      <div className="flex gap-2">
                        {presets.map((p) => (
                          <button
                            key={p}
                            onClick={() => setAmount(p)}
                            className={`h-10 px-3 rounded-xl border text-sm transition ${
                              Number(amount) === p
                                ? "bg-[#4D63FF]/20 border-[#4D63FF]/40 text-white"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            {formatVND(p)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-white/60 mb-1">Lời nhắn</div>
                    <div className="relative">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                        placeholder="Nhập lời nhắn"
                        rows={4}
                        className="w-full px-3 py-2 rounded-xl bg-[#10131B] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4D63FF]/40 resize-none"
                      />
                      <div className="absolute bottom-2 right-3 text-xs text-white/50">
                        {message.length}/200
                      </div>
                    </div>
                  </div>

                  {/* PREMIUM BLOCK (giống ảnh: nằm trong card donate) */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Dành cho premium</div>
                      <button className="text-xs font-semibold text-yellow-300 hover:text-yellow-200 px-0 py-0 bg-transparent border-0 shadow-none">
                        Đăng ký ngay
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-white/70">Tạo QR / bật thông báo</div>
                      <div className="flex items-center gap-2">
                        <button className="h-8 px-3 rounded-lg bg-[#4D63FF]/20 border border-[#4D63FF]/30 text-sm">
                          QR
                        </button>
                        <button className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-sm">
                          Chỉnh sửa
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DONATE BUTTON (to, bo tròn giống ảnh) */}
                  <button
                    onClick={handleDonate}
                    className="w-full h-11 rounded-2xl bg-[#E7E7EA] text-black font-semibold hover:bg-white transition"
                  >
                    Donate
                  </button>
                </div>
              </div>

              {/* PROGRESS CARD nhỏ */}
              <div className="bg-[#151824] border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center">🗑️</span>
                    <span className="text-yellow-300 font-semibold">Về cái này 10 nữa đi ông ơi</span>
                  </div>
                  <span className="text-white/60">0/10</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[20%] bg-[#4D63FF]" />
                </div>
              </div>

              {/* LEADERBOARD */}
              <div className="bg-[#151824] border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">Bảng xếp hạng</div>
                  <div className="flex gap-2">
                    {[
                      { k: "day", t: "Ngày" },
                      { k: "week", t: "Tuần" },
                      { k: "month", t: "Tháng" },
                    ].map((x) => (
                      <button
                        key={x.k}
                        onClick={() => setLbTab(x.k)}
                        className={`h-8 px-3 rounded-lg border text-sm transition ${
                          lbTab === x.k
                            ? "bg-white/90 text-black border-white/20"
                            : "bg-transparent text-white/70 border-white/10 hover:bg-white/5"
                        }`}
                      >
                        {x.t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-white/10">
                  {leaderboard.length === 0 ? (
                    <div className="py-6 text-sm text-white/60">Chưa có donate.</div>
                  ) : (
                    leaderboard.map((u, idx) => (
                      <div key={u.name + idx} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 text-white/60">{idx + 1}</div>
                          <div className="w-6 text-yellow-300">{idx === 0 ? "👑" : "♟️"}</div>
                          <div className="text-sm">{u.name}</div>
                        </div>
                        <div className="text-sm text-white/80">{formatVND(u.total)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-7">
              <div className="bg-[#151824] border border-white/10 rounded-2xl">
                <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
                  <div className="font-semibold">Gần đây</div>
                  <div className="text-xs text-white/60">{loading ? "Đang tải..." : ""}</div>
                </div>

                {/* scroll list */}
                <div className="h-[720px] overflow-y-auto z-scroll">
                  {donations.map((d, i) => (
                    <div key={d._id || i} className="px-5 py-4 border-b border-white/10">
                      <div className="flex gap-3">
                        <img
                          src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(d.name || "anon")}`}
                          className="w-9 h-9 rounded-full border border-white/10 bg-white/5"
                          alt="ava"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">{d.name || "Ẩn danh"}</div>
                            <div className="text-xs text-white/60">{timeAgo(d.createdAt)}</div>
                          </div>

                          <div className="text-xs text-white/70 mt-0.5">
                            Donate: <span className="text-white/90 font-semibold">{formatVND(d.amount)}</span>{" "}
                            <span className="text-white/60">với lời nhắn</span>
                          </div>

                          {d.message ? (
                            <div className="text-sm text-white/80 mt-2 whitespace-pre-wrap">{d.message}</div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}

                  {donations.length === 0 && !loading ? (
                    <div className="px-5 py-10 text-sm text-white/60">Chưa có donate nào.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          {/* end */}
        </div>
      </div>
    </div>
  );
}
