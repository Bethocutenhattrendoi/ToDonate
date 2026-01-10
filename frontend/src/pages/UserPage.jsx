import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DonateModule from "@/components/DonateModule";

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
  if (mode === "all") return true;

  const t = new Date(createdAt).getTime();
  const now = Date.now();
  const diff = now - t;
  const day = 24 * 60 * 60 * 1000;

  if (mode === "day") return diff <= day;
  if (mode === "month") return diff <= 30 * day;

  return true;
}

export default function UserPage() {
  const { username } = useParams();

  // data
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState([]);
  const [lbTab, setLbTab] = useState("day"); // day|month|all

  const avatarUrl = useMemo(() => {
    return `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(username || "user")}`;
  }, [username]);

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

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-[#0B0E14] text-white">
      {/* COVER */}
      <div className="relative">
        <div className="h-40 md:h-52 w-full overflow-hidden relative">
          <img
            src={coverUrl}
            className="w-full h-full object-cover"
            alt="cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          {/* quan trọng: pointer-events-none để không chặn click */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/45 to-black/10" />
        </div>

        <div className="max-w-6xl mx-auto px-4">
          {/* TAB Donate */}
          <div className="-mt-10 flex items-center pl-20 relative z-30">
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-t-2xl
                         bg-gradient-to-r from-[#4D63FF] to-[#6C7BFF]
                         text-white text-sm font-extrabold tracking-wide
                         shadow-xl shadow-[#4D63FF]/35
                         ring-1 ring-white/15"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-sm shadow-yellow-300/40" />
              DONATE
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
              </div>
            </div>
          </div>

          {/* 2 CỘT */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
            {/* LEFT */}
            <div className="lg:col-span-5 space-y-4">
              {/* DONATE MODULE */}
              <DonateModule
                receiverUsername={username}
                onSuccess={fetchDonations}
              />

            

              {/* LEADERBOARD */}
              <div className="bg-[#151824] border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">Bảng xếp hạng</div>

                  {/* Tabs */}
                  <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                    {[
                      { k: "day", t: "Ngày" },
                      { k: "month", t: "Tháng" },
                      { k: "all", t: "Tổng" },
                    ].map((x) => {
                      const active = lbTab === x.k;
                      return (
                        <button
                          key={x.k}
                          onClick={() => setLbTab(x.k)}
                          className={[
                            "h-8 px-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center leading-none",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4D63FF]/50",
                            active
                              ? "text-white bg-gradient-to-b from-[#5B6CFF] to-[#3F56FF] shadow-md shadow-[#4D63FF]/25 border border-white/10"
                              : "text-white/70 hover:text-white bg-transparent hover:bg-white/5 border border-transparent",
                          ].join(" ")}
                        >
                          {x.t}
                        </button>
                      );
                    })}
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
