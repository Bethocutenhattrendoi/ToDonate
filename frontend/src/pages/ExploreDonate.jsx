import { useMemo, useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";

export default function ExploreDonate() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Tất cả");

  const games = useMemo(
    () => [
      { name: "Minecraft", count: 62, icon: "🟩" },
      { name: "PUBG PC", count: 56, icon: "🎯" },
      { name: "Free Fire", count: 44, icon: "🔥" },
      { name: "Roblox", count: 42, icon: "🧱" },
      { name: "CSGO", count: 32, icon: "💥" },
      { name: "GTA V", count: 31, icon: "🚗" },
      { name: "PUBG M", count: 23, icon: "📱" },
      { name: "Tốc Chiến", count: 15, icon: "⚔️" },
      { name: "COD", count: 8, icon: "🪖" },
      { name: "Dota 2", count: 6, icon: "🛡️" },
      { name: "Fortnite", count: 4, icon: "🌪️" },
    ],
    []
  );

  const leaderboard = useMemo(
    () => [
      { rank: 1, name: "C4 Gaming", verified: true },
      { rank: 2, name: "Sena", verified: true },
      { rank: 3, name: "TÙNG BÙI FCO", verified: true },
      { rank: 4, name: "kayff", verified: true },
      { rank: 5, name: "Levi", verified: true },
      { rank: 6, name: "Negan", verified: true },
      { rank: 7, name: "Nhism", verified: true },
    ],
    []
  );

  const streamers = useMemo(
    () => [
      { name: "mixigaming", followers: 1342, verified: true },
      { name: "TUTTENBO", followers: 429, verified: true },
      { name: "Bác Gấu", followers: 383, verified: true },
      { name: "KisaDepTraii", followers: 210, verified: true },
      { name: "Sena", followers: 980, verified: true },
      { name: "KiraMC", followers: 510, verified: true },
    ],
    []
  );

  const statusOptions = ["Tất cả", "Đang hoạt động", "Tạm dừng"];

  return (
    <div className="min-h-screen bg-[#0b0f16] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Top */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-xl font-semibold tracking-wide">
              To Donate <span className="text-white/60"> steamer</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/80">
              <button className="hover:text-white">DONATE</button>
              <button className="hover:text-white">BOOKING</button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-white/80">
            <button className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10" />
            <button className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10" />
            <div className="h-9 w-9 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-[260px]">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {/* status dropdown đơn giản (không cần component dropdown-menu) */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-sm text-white/70">Trạng thái:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-transparent text-sm outline-none"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s} className="text-black">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <Button className="rounded-xl bg-indigo-500 hover:bg-indigo-600">
            Tìm kiếm
          </Button>
        </div>

        {/* Game row */}
        <div className="mt-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {games.map((g) => (
              <button
                key={g.name}
                className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10"
              >
                <span className="text-lg">{g.icon}</span>
                <span className="text-sm">{g.name}</span>
                <Badge className="bg-white/10 text-white/80 hover:bg-white/10">
                  {g.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2 text-base font-semibold">
            <span className="text-yellow-300">◆</span>
            <span>Bảng Xếp Hạng Tháng</span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {leaderboard.map((x) => (
              <Card
                key={x.rank}
                className="w-[210px] shrink-0 rounded-2xl border-white/10 bg-white/5 p-4"
              >
                <div className="text-3xl font-bold text-white/30">
                  {x.rank}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-white/10 text-white">
                      {x.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-semibold">{x.name}</div>
                      {x.verified && (
                        <span className="text-xs text-sky-300">✔</span>
                      )}
                    </div>
                    <div className="text-xs text-white/50">
                      Top tháng này
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Streamer grid */}
        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-white/70">
              Streamer <span className="text-white/40">• 986 trang</span>
            </div>
            <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
              Tất cả →
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {streamers.map((s) => (
              <Card
                key={s.name}
                className="rounded-2xl border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-white/10 text-white">
                      {s.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-semibold">{s.name}</div>
                      {s.verified && (
                        <span className="text-xs text-sky-300">✔</span>
                      )}
                    </div>
                    <div className="text-xs text-white/50">
                      {s.followers} người theo dõi
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
